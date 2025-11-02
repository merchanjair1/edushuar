import { Component, inject, OnInit, signal, computed, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, doc, updateDoc, deleteDoc, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { WordForm } from './components/word-form/word-form';
import { ContentForm } from './components/content-form/content-form';

export interface Contribution {
  id: string;
  title: string;
  shuarTitle?: string;
  category: string;
  contentType: string;
  contributor: string;
  submissionDate: any; // Firestore Timestamp
  moderation: { status: 'pending' | 'approved' | 'rejected' };
  fileUrl: string;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';
type FormType = 'word' | 'content';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule, YouTubePlayerModule, WordForm, ContentForm],
  templateUrl: './moderation.html',
  styleUrls: ['./moderation.scss']
})
export class Moderation implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  private contributions$: Observable<Contribution[]>;
  contributions: WritableSignal<Contribution[]> = signal([]);
  gamesAndLessons: WritableSignal<any[]> = signal([]);
  dictionaryEntries: WritableSignal<any[]> = signal([]);

  searchTerm: WritableSignal<string> = signal('');
  statusFilter: WritableSignal<StatusFilter> = signal('all');
  activeTab: WritableSignal<'contributions' | 'games_and_lessons' | 'dictionary'> = signal('contributions');

  selectedFileUrl: WritableSignal<SafeResourceUrl | null> = signal(null);
  isModalOpen: WritableSignal<boolean> = signal(false);
  youtubeVideoId: WritableSignal<string | null> = signal(null);

  showFormModal = signal(false);
  formToShow: WritableSignal<FormType | null> = signal(null);

  pendingCount = computed(() => this.contributions().filter(c => c.moderation.status === 'pending').length);
  approvedCount = computed(() => this.contributions().filter(c => c.moderation.status === 'approved').length);
  rejectedCount = computed(() => this.contributions().filter(c => c.moderation.status === 'rejected').length);
  totalCount = computed(() => this.contributions().length);

  filteredContributions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filter = this.statusFilter();
    let filtered = this.contributions();

    if (term) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.shuarTitle?.toLowerCase().includes(term) ||
        this.getCategoryDisplay(c.category).toLowerCase().includes(term) ||
        c.contributor.toLowerCase().includes(term)
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(c => c.moderation.status === filter);
    }

    return filtered;
  });

  constructor() {
    const contributionsCollection = collection(this.firestore, 'community-contributions');
    this.contributions$ = collectionData(contributionsCollection, { idField: 'id' }) as Observable<Contribution[]>;
  }

  ngOnInit(): void {
    this.contributions$.subscribe(data => {
      this.contributions.set(data);
    });

    // Fetch games_and_lessons
    const gamesAndLessonsCollection = collection(this.firestore, 'games_and_lessons');
    collectionData(gamesAndLessonsCollection, { idField: 'id' }).subscribe(data => {
      this.gamesAndLessons.set(data);
    });

    // Fetch dictionary
    const dictionaryCollection = collection(this.firestore, 'dictionary');
    collectionData(dictionaryCollection, { idField: 'id' }).subscribe(data => {
      this.dictionaryEntries.set(data);
    });
  }

  setActiveTab(tab: 'contributions' | 'games_and_lessons' | 'dictionary') {
    this.activeTab.set(tab);
  }

  async updateGameOrLesson(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, 'games_and_lessons', id);
    try {
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating game or lesson:', error);
    }
  }

  async deleteGameOrLesson(id: string): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar este juego/lección permanentemente?')) {
      const docRef = doc(this.firestore, 'games_and_lessons', id);
      try {
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting game or lesson:', error);
      }
    }
  }

  async updateDictionaryEntry(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, 'dictionary', id);
    try {
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating dictionary entry:', error);
    }
  }

  async deleteDictionaryEntry(id: string): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar esta entrada del diccionario permanentemente?')) {
      const docRef = doc(this.firestore, 'dictionary', id);
      try {
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting dictionary entry:', error);
      }
    }
  }

  openFormModal(formType: FormType): void {
    this.formToShow.set(formType);
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.formToShow.set(null);
  }

  setFilter(filter: StatusFilter) {
    this.statusFilter.set(filter);
  }

  openModal(url: string) {
    const videoId = this.getYouTubeVideoId(url);
    if (videoId) {
      this.youtubeVideoId.set(videoId);
    } else {
      this.selectedFileUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedFileUrl.set(null);
    this.youtubeVideoId.set(null);
  }

  getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  async approveContribution(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'community-contributions', id);
    try {
      await updateDoc(docRef, { 'moderation.status': 'approved' });
    } catch (error) {
      console.error('Error approving contribution:', error);
    }
  }

  async rejectContribution(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'community-contributions', id);
    try {
      await updateDoc(docRef, { 'moderation.status': 'rejected' });
    } catch (error) {
      console.error('Error rejecting contribution:', error);
    }
  }

  async deleteContribution(id: string): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar esta contribución permanentemente?')) {
      const docRef = doc(this.firestore, 'community-contributions', id);
      try {
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting contribution:', error);
      }
    }
  }

  getCategoryDisplay(category: string): string {
    if (!category) {
      return 'Sin categoría';
    }
    const categories: { [key: string]: string } = {
      medicine: 'Medicina Tradicional',
      ritual: 'Rituales y Ceremonias',
      music: 'Música y Danza',
      history: 'Historia Oral',
      language: 'Lengua y Vocabulario',
    };
    return categories[category] || category;
  }

  getContentTypeDisplay(contentType: string): string {
    const types: { [key: string]: string } = {
      audio: 'Audio',
      video: 'Video',
      image: 'Imagen',
      document: 'Documento',
    };
    return types[contentType] || contentType;
  }

  getContentTypeIcon(contentType: string): string {
    const icons: { [key: string]: string } = {
      audio: 'fas fa-headphones-alt',
      video: 'fas fa-video',
      image: 'fas fa-image',
      document: 'fas fa-file-alt',
    };
    return icons[contentType] || 'fas fa-question-circle';
  }
}