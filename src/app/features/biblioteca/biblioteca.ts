import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, increment } from '@angular/fire/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YouTubePlayerModule } from '@angular/youtube-player';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [FormsModule, CommonModule, YouTubePlayerModule],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.scss'
})
export class Biblioteca implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedContentType: string = 'all';

  allContent: any[] = [];
  filteredContent: any[] = [];

  selectedContent: any | null = null;
  selectedContentUrl: SafeResourceUrl | null = null;
  youtubeVideoId: string | null = null;
  showIframeModal: boolean = false;

  ngOnInit(): void {
    this.fetchApprovedContributions();
    this.loadYouTubeApi();
  }

  async fetchApprovedContributions(): Promise<void> {
    const contributionsCollection = collection(this.firestore, 'community-contributions');
    const q = query(contributionsCollection, where('moderation.status', '==', 'approved'));
    const querySnapshot = await getDocs(q);

    this.allContent = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const mappedData = {
        id: doc.id,
        category: data['category'] || '',
        type: data['contentType'] || '',
        title: data['title'] || '',
        shuarTitle: data['shuarTitle'] || '',
        description: data['description'] || '',
        shuarDescription: data['shuarDescription'] || '',
        duration: data['duration'] ? `${data['duration']} min` : '',
        views: data['viewCount'] || 0,
        contributor: data['contributor'] || '',
        fileUrl: data['fileUrl'] || '',
      };
      return mappedData;
    });
    this.filterContent();
  }

  onSearchChange(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterContent();
  }

  onCategoryChange(event: Event) {
    this.selectedCategory = (event.target as HTMLSelectElement).value;
    this.filterContent();
  }

  onContentTypeChange(type: string) {
    this.selectedContentType = type;
    this.filterContent();
  }

  filterContent() {
    this.filteredContent = this.allContent.filter(item => {
      const matchesCategory = this.selectedCategory === 'all' || item.category === this.selectedCategory;
      const matchesContentType = this.selectedContentType === 'all' || item.type === this.selectedContentType;
      const matchesSearchTerm = item.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                                item.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                                item.contributor.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesContentType && matchesSearchTerm;
    });
  }

  async openContent(item: any): Promise<void> {
    const docRef = doc(this.firestore, 'community-contributions', item.id);
    await updateDoc(docRef, { viewCount: increment(1) });
    item.views++;

    this.selectedContent = item;
    this.youtubeVideoId = this.getYouTubeVideoId(item.fileUrl);

    if (item.type === 'video' && this.youtubeVideoId) {
      this.showIframeModal = true;
    } else if (item.type === 'video' || item.type === 'audio' || item.type === 'image') {
      this.selectedContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(item.fileUrl);
      this.showIframeModal = true;
    } else {
      window.open(item.fileUrl, '_blank');
    }
  }

  closeIframeModal(): void {
    this.showIframeModal = false;
    this.selectedContent = null;
    this.selectedContentUrl = null;
    this.youtubeVideoId = null;
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

  async downloadContent(item: any): Promise<void> {
    try {
      const response = await fetch(item.fileUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('No se pudo descargar el archivo. Por favor, intente de nuevo.');
    }
  }

  getActionText(type: string): string {
    const actions: { [key: string]: string } = {
      video: 'Ver Video',
      audio: 'Reproducir',
      image: 'Ver Imagen',
      document: 'Ver Documento',
    };
    return actions[type] || 'Ver Contenido';
  }

  getActionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      video: 'fas fa-video',
      audio: 'fas fa-headphones-alt',
      image: 'fas fa-image',
      document: 'fas fa-file-alt',
    };
    return icons[type] || 'fas fa-eye';
  }

  getCategoryDisplay(category: string): string {
    const categories: { [key: string]: string } = {
      medicine: 'Medicina Tradicional',
      ritual: 'Rituales y Ceremonias',
      music: 'Música y Danza',
      history: 'Historia Oral',
      language: 'Lengua y Vocabulario',
    };
    return categories[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      medicine: 'fas fa-leaf',
      ritual: 'fas fa-hand-sparkles',
      music: 'fas fa-music',
      history: 'fas fa-book',
      language: 'fas fa-language',
    };
    return icons[category] || 'fas fa-folder';
  }

  get totalViews(): number {
    return this.filteredContent.reduce((sum, item) => sum + item.views, 0);
  }
}
