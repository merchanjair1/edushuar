import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CloudinaryApi } from '../../../../core/services/cloudinary-api';

export interface Word {
  spanish: string;
  shuar: string;
  significado: string;
  category: string;
  difficulty: string;
  imageUrl: string;
}

@Component({
  selector: 'app-word-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './word-form.html',
  styleUrls: ['./word-form.scss']
})
export class WordForm {
  private firestore: Firestore = inject(Firestore);
  private cloudinaryApi: CloudinaryApi = inject(CloudinaryApi);

  wordForm: FormGroup;
  selectedFile: File | null = null;

  @ViewChild('wordImageInput') wordImageInput!: ElementRef<HTMLInputElement>;

  wordCategories = [
    { id: 'Todo', name: 'Todo' },
    { id: 'Familia', name: 'Familia' },
    { id: 'Hogar', name: 'Hogar' },
    { id: 'Naturaleza', name: 'Naturaleza' },
    { id: 'Plantas', name: 'Plantas' },
    { id: 'Animales', name: 'Animales' },
    { id: 'Cultura', name: 'Cultura' },
    { id: 'Partes del Cuerpo', name: 'Partes del Cuerpo' },
  ];

  difficulties = [
    { id: 'Basica', name: 'Básica' },
    { id: 'Media', name: 'Media' },
    { id: 'Avanzada', name: 'Avanzada' },
  ];

  constructor() {
    this.wordForm = new FormGroup({
      spanish: new FormControl('', [Validators.required]),
      shuar: new FormControl('', [Validators.required]),
      significado: new FormControl('', [Validators.required]),
      category: new FormControl('', [Validators.required]),
      difficulty: new FormControl('', [Validators.required]),
      image: new FormControl<File | null>(null, [Validators.required])
    });
  }

  onFileChange(event: any): void {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      this.wordForm.patchValue({ image: file });
      this.selectedFile = file;
    }
  }

  onSubmitWord(): void {
    if (this.wordForm.invalid) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    if (!this.selectedFile) {
      alert('Por favor, selecciona una imagen.');
      return;
    }

    this.cloudinaryApi.upload(this.selectedFile).subscribe(result => {
      if (result.url) {
        const newWord: Word = {
          spanish: this.wordForm.value.spanish,
          shuar: this.wordForm.value.shuar,
          significado: this.wordForm.value.significado,
          category: this.wordForm.value.category,
          difficulty: this.wordForm.value.difficulty,
          imageUrl: result.url
        };

        const dictionaryCollection = collection(this.firestore, 'dictionary');
        addDoc(dictionaryCollection, newWord).then(() => {
          alert('Palabra guardada exitosamente');
          this.wordForm.reset();
          this.selectedFile = null;
          if (this.wordImageInput) {
            this.wordImageInput.nativeElement.value = '';
          }
        }).catch(error => {
          console.error('Error guardando la palabra:', error);
          alert('Hubo un error al guardar la palabra.');
        });
      } else if (result.error) {
        console.error('Cloudinary upload error:', result.error);
        alert('Hubo un error al subir la imagen.');
      }
    });
  }
}