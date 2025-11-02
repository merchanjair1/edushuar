import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Word {
  spanish: string;
  shuar: string;
  significado: string;
  category: string;
  difficulty: string;
  imageUrl: string;
}

@Component({
  selector: 'app-dictionary',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dictionary.html',
  styleUrl: './dictionary.scss'
})
export class Dictionary implements OnInit {
  private firestore: Firestore = inject(Firestore);

  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedDifficulty: string = 'all';

  allWords$: Observable<Word[]>;
  allWords: Word[] = [];
  filteredWords: Word[] = [];

  // Categories and difficulties from moderation.ts for consistency
  wordCategories = [
    { id: 'all', name: 'Todo' },
    { id: 'Familia', name: 'Familia' },
    { id: 'Hogar', name: 'Hogar' },
    { id: 'Naturaleza', name: 'Naturaleza' },
    { id: 'Plantas', name: 'Plantas' },
    { id: 'Animales', name: 'Animales' },
    { id: 'Cultura', name: 'Cultura' },
    { id: 'Partes del Cuerpo', name: 'Partes del Cuerpo' },
  ];

  difficulties = [
    { id: 'all', name: 'Todos' },
    { id: 'Basica', name: 'Básica' },
    { id: 'Media', name: 'Media' },
    { id: 'Avanzada', name: 'Avanzada' },
  ];

  constructor() {
    const dictionaryCollection = collection(this.firestore, 'dictionary');
    this.allWords$ = collectionData(dictionaryCollection, { idField: 'id' }) as Observable<Word[]>;
  }

  ngOnInit(): void {
    this.allWords$.subscribe(words => {
      this.allWords = words;
      this.filterWords();
    });
  }

  onSearchChange(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterWords();
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.filterWords();
  }

  onDifficultyChange(difficulty: string) {
    this.selectedDifficulty = difficulty;
    this.filterWords();
  }

  filterWords() {
    this.filteredWords = this.allWords.filter(word => {
      const matchesCategory = this.selectedCategory === 'all' || word.category.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchesDifficulty = this.selectedDifficulty === 'all' || word.difficulty.toLowerCase() === this.selectedDifficulty.toLowerCase();
      const matchesSearchTerm = word.shuar.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                                word.spanish.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                                word.significado.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesDifficulty && matchesSearchTerm;
    });
  }
}
