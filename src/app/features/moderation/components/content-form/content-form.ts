import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-content-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './content-form.html',
  styleUrls: ['./content-form.scss']
})
export class ContentForm {
  private firestore: Firestore = inject(Firestore);
  contentForm: FormGroup;

  constructor() {
    this.contentForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      link: new FormControl('', [Validators.required]),
      difficulty: new FormControl('', [Validators.required]),
      category: new FormControl('', [Validators.required])
    });
  }

  onSubmitContent(): void {
    if (this.contentForm.valid) {
      const gamesAndLessonsCollection = collection(this.firestore, 'games_and_lessons');
      addDoc(gamesAndLessonsCollection, this.contentForm.value).then(() => {
        alert('Contenido guardado exitosamente.');
        this.contentForm.reset();
      }).catch(error => {
        console.error('Error guardando el contenido:', error);
        alert('Hubo un error al guardar el contenido.');
      });
    } else {
      alert('Por favor, completa todos los campos.');
    }
  }
}