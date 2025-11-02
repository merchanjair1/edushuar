import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { FormsModule } from '@angular/forms'; // For filters
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Import HttpClient

export interface Story {
  id: string;
  title: string;
  shuarTitle?: string;
  description?: string;
  category: string;
  author: string;
  fileUrl: string;
  type: string;
  views?: number; // Added for progress tracking/consistency with biblioteca
  isCompleted?: boolean; // For progress tracking
}

@Component({
  standalone: true,
  imports: [CommonModule, YouTubePlayerModule, FormsModule, HttpClientModule], // Add HttpClientModule
  selector: 'app-stories',
  templateUrl: './stories.html',
  styleUrls: ['./stories.scss']
})
export class Stories implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  private http: HttpClient = inject(HttpClient); // Inject HttpClient

  historiaOralStories: WritableSignal<Story[]> = signal([]);
  filteredStories: WritableSignal<Story[]> = signal([]); // For filtered content
  selectedContentType: string = 'all'; // For content type filter

  selectedContent: Story | null = null;
  selectedContentUrl: SafeResourceUrl | null = null;
  selectedTextContent: string | null = null;
  selectedVideoUrl: SafeResourceUrl | null = null; // New property for video URL
  selectedAudioUrl: SafeResourceUrl | null = null; // New property for audio URL
  youtubeVideoId: string | null = null;
  showIframeModal: boolean = false;

  constructor() {
    const storiesCollection = collection(this.firestore, 'community-contributions');
    const q = query(storiesCollection,
                  where('moderation.status', '==', 'approved'),
                  where('category', '==', 'history'));

    console.log('Firestore query for stories:', q); // Added log

    const stories$ = collectionData(q, { idField: 'id' }).pipe(
      map(items => items.map(item => ({
        id: item['id'],
        title: item['title'],
        shuarTitle: item['shuarTitle'],
        description: item['description'],
        category: item['category'],
        author: item['contributor'],
        fileUrl: item['fileUrl'],
        type: item['contentType'] || 'text',
        views: item['viewCount'] || 0,
        isCompleted: false, // Initialize as not completed
      }) as Story))
    );

    stories$.subscribe(data => {
      console.log('Data received from Firestore:', data); // Added log
      this.historiaOralStories.set(data);
      this.loadProgressFromLocalStorage(); // Load progress after stories are set
      this.filterStories(); // Apply initial filter
    });
  }

  ngOnInit(): void {
    this.loadYouTubeApi();
  }

  // --- Content Display Logic (from Biblioteca) ---
  openContent(item: Story): void {
    console.log('openContent called for item:', item);
    this.selectedContent = item;
    this.youtubeVideoId = null;
    this.selectedContentUrl = null;
    this.selectedTextContent = null;

    if (!item.fileUrl) {
      console.error('No fileUrl provided for this content.');
      return;
    }

    // Handle YouTube videos
    if (item.type === 'video') {
      const videoId = this.getYouTubeVideoId(item.fileUrl);
      if (videoId) {
        this.youtubeVideoId = videoId;
        this.showIframeModal = true;
        return;
      }
    }

    // Handle other video, audio, and image types directly in iframe
    if (item.type === 'video' || item.type === 'audio' || item.type === 'image') {
      this.selectedContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(item.fileUrl);
      this.showIframeModal = true;
    }
    // Handle text and documents
    else if (item.type === 'text' || item.type === 'document') {
      this.http.get(item.fileUrl, { responseType: 'text' }).subscribe({
        next: (data) => {
          this.selectedTextContent = data;
          this.showIframeModal = true;
        },
        error: (err) => {
          console.error('Error fetching text content:', err);
          // Fallback to iframe for documents like PDFs that might not be text
          this.selectedContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(item.fileUrl);
          this.showIframeModal = true;
        }
      });
    }
    // Fallback for any other case
    else {
      console.log('Opening content in new tab:', item.fileUrl);
      window.open(item.fileUrl, '_blank');
    }
  }

  closeIframeModal(): void {
    console.log('closeIframeModal called. showIframeModal before closing:', this.showIframeModal); // New log
    // Mark content as completed when modal is closed
    if (this.selectedContent) {
      const currentStories = this.historiaOralStories();
      const updatedStories = currentStories.map(story =>
        story.id === this.selectedContent?.id ? { ...story, isCompleted: true } : story
      );
      this.historiaOralStories.set(updatedStories);
      this.saveProgressToLocalStorage(); // Save progress
      this.filterStories(); // Re-apply filter to update view
    }

    this.showIframeModal = false;
    this.selectedContent = null;
    this.selectedContentUrl = null;
    this.selectedTextContent = null; // Reset text content
    this.youtubeVideoId = null;
    console.log('showIframeModal after closing:', this.showIframeModal); // New log
  }

  getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  loadYouTubeApi() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }

  // --- Dynamic Button Text ---
  getActionText(type: string): string {
    const actions: { [key: string]: string } = {
      video: 'Mostrar Video',
      audio: 'Reproducir Audio',
      image: 'Mostrar Imagen',
      document: 'Mostrar Documento',
      text: 'Mostrar Texto',
    };
    return actions[type] || 'Mostrar Contenido';
  }

  // --- Content Filtering ---
  onContentTypeChange(type: string): void {
    this.selectedContentType = type;
    this.filterStories();
  }

  filterStories(): void {
    const filtered = this.historiaOralStories().filter(story => {
      const matchesContentType = this.selectedContentType === 'all' || story.type === this.selectedContentType;
      return matchesContentType;
    });
    console.log('historiaOralStories after filter:', this.historiaOralStories()); // Added log
    console.log('Filtered stories:', filtered); // Added log
    this.filteredStories.set(filtered);
  }

  // --- Progress Tracking (for YouTube videos) ---
  onPlayerStateChange(event: any): void {
    // YT.PlayerState.ENDED is 0
    if (event.data === 0 && this.selectedContent) {
      const currentStories = this.historiaOralStories();
      const updatedStories = currentStories.map(story =>
        story.id === this.selectedContent?.id ? { ...story, isCompleted: true } : story
      );
      this.historiaOralStories.set(updatedStories);
      this.saveProgressToLocalStorage(); // Save progress
      this.filterStories(); // Re-apply filter to update view
    }
  }

  // --- Local Storage Persistence ---
  private localStorageKey = 'shuarStoriesProgress';

  private loadProgressFromLocalStorage(): void {
    const savedProgress = localStorage.getItem(this.localStorageKey);
    if (savedProgress) {
      const completedStoryIds: string[] = JSON.parse(savedProgress);
      const currentStories = this.historiaOralStories();
      const updatedStories = currentStories.map(story => ({
        ...story,
        isCompleted: completedStoryIds.includes(story.id)
      }));
      this.historiaOralStories.set(updatedStories);
    }
  }

  private saveProgressToLocalStorage(): void {
    const completedStoryIds = this.historiaOralStories()
      .filter(story => story.isCompleted)
      .map(story => story.id);
    localStorage.setItem(this.localStorageKey, JSON.stringify(completedStoryIds));
  }

  get completedStoriesCount(): number {
    return this.historiaOralStories().filter(story => story.isCompleted).length;
  }

  get totalStoriesCount(): number {
    return this.historiaOralStories().length;
  }

  get progressPercentage(): number {
    if (this.totalStoriesCount === 0) {
      return 0;
    }
    return (this.completedStoriesCount / this.totalStoriesCount) * 100;
  }
}
