import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { finalize } from 'rxjs/operators';
import { 
    Firestore, 
    collection, 
    addDoc, 
    Timestamp 
} from '@angular/fire/firestore';
import { CloudinaryApi } from '../../core/services/cloudinary-api';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-contribuir',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './contribuir.html',
  styleUrls: ['./contribuir.scss'],
})
export class ContribuirComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private firestore: Firestore = inject(Firestore);
  private cloudinaryApi = inject(CloudinaryApi);

  activeTab: 'form' | 'guidelines' = 'form';
  contributionForm!: FormGroup;
  uploadProgress = 0;
  isUploading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  fileAcceptTypes = 'audio/*,video/*,image/*,application/pdf';
  private uploadSub: Subscription | null = null;
  private valueChangesSub: Subscription | null = null;

  contentTypes = [
    { id: 'audio', name: 'Audio', icon: 'fas fa-volume-up', accept: 'audio/*' },
    { id: 'video', name: 'Video', icon: 'fas fa-video', accept: 'video/*' },
    { id: 'image', name: 'Imagen', icon: 'fas fa-image', accept: 'image/*' },
    { id: 'document', name: 'Documento', icon: 'fas fa-file-alt', accept: 'application/pdf' },
  ];

  categories = [
    { id: 'medicine', name: 'Medicina Tradicional' },
    { id: 'ritual', name: 'Rituales y Ceremonias' },
    { id: 'music', name: 'Música y Danza' },
    { id: 'history', name: 'Historia Oral' },
    { id: 'language', name: 'Lengua y Vocabulario' },
  ];

  ngOnInit(): void {
    this.contributionForm = this.fb.group({
      contentType: ['image', Validators.required],
      videoInputMethod: ['upload'],
      file: [null],
      videoUrl: [''],
      title: ['', Validators.required],
      shuarTitle: [''],
      description: ['', Validators.required],
      shuarDescription: [''],
      category: ['', Validators.required],
      tags: [''],
      contributor: [''],
      location: [''],
      culturalImportance: [''],
      ageRestriction: ['all'],
      permissions: [false, Validators.requiredTrue],
      respect: [false, Validators.requiredTrue],
    });

    this.selectContentType('image');
    this.setupConditionalValidators();
  }

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.valueChangesSub?.unsubscribe();
  }

  private setupConditionalValidators(): void {
    const videoInputMethodControl = this.contributionForm.get('videoInputMethod');
    this.valueChangesSub = videoInputMethodControl
      ? videoInputMethodControl.valueChanges.subscribe(method => {
          const fileControl = this.contributionForm.get('file');
          const videoUrlControl = this.contributionForm.get('videoUrl');

          if (this.contributionForm.get('contentType')?.value === 'video') {
            if (method === 'upload') {
              fileControl?.setValidators(Validators.required);
              videoUrlControl?.clearValidators();
            } else { // url
              fileControl?.clearValidators();
              videoUrlControl?.setValidators([Validators.required, Validators.pattern('https?://.+')]);
            }
          } else {
            fileControl?.setValidators(Validators.required);
            videoUrlControl?.clearValidators();
          }
          fileControl?.updateValueAndValidity();
          videoUrlControl?.updateValueAndValidity();
        })
      : null;
  }

  selectContentType(typeId: string): void {
    this.contributionForm.get('contentType')?.setValue(typeId);
    const selectedType = this.contentTypes.find(t => t.id === typeId);
    this.fileAcceptTypes = selectedType ? selectedType.accept : '*';

    const fileControl = this.contributionForm.get('file');
    const videoUrlControl = this.contributionForm.get('videoUrl');

    if (typeId === 'video') {
      this.contributionForm.get('videoInputMethod')?.enable();
      this.contributionForm.get('videoInputMethod')?.updateValueAndValidity();
    } else {
      this.contributionForm.get('videoInputMethod')?.disable();
      fileControl?.setValidators(Validators.required);
      videoUrlControl?.clearValidators();
    }
    fileControl?.updateValueAndValidity();
    videoUrlControl?.updateValueAndValidity();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.contributionForm.patchValue({ file: input.files[0] });
    } else {
      this.contributionForm.patchValue({ file: null });
    }
  }

  onSubmit(): void {
    if (this.contributionForm.invalid) {
      this.contributionForm.markAllAsTouched();
      return;
    }

    const formValue = this.contributionForm.value;

    if (formValue.contentType === 'video' && formValue.videoInputMethod === 'url') {
      this.saveContribution(formValue.videoUrl);
    } else {
      this.uploadFileAndSave(formValue.file);
    }
  }

  private uploadFileAndSave(file: File): void {
    this.isUploading = true;
    this.successMessage = null;
    this.errorMessage = null;
    this.uploadProgress = 0;

    this.uploadSub = this.cloudinaryApi.upload(file).pipe(
      finalize(() => {
        this.isUploading = false;
      })
    ).subscribe(result => {
      this.uploadProgress = result.progress;
      if (result.error) {
        this.errorMessage = 'Hubo un error al subir el archivo. Por favor, inténtalo de nuevo.';
        this.isUploading = false;
      }
      if (result.url) {
        this.saveContribution(result.url);
      }
    });
  }

  private async saveContribution(fileUrl: string): Promise<void> {
    const { file, videoUrl, ...formValue } = this.contributionForm.value;
    const contributionData = {
      ...formValue,
      tags: formValue.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      fileUrl: fileUrl, 
      moderation: { status: 'pending' },
      submissionDate: Timestamp.now(),
    };

    try {
      const contributionsCollection = collection(this.firestore, 'community-contributions');
      await addDoc(contributionsCollection, contributionData);
      this.successMessage = '¡Tu contribución ha sido enviada con éxito para su revisión!';
      this.resetForm();
    } catch (dbError) {
      console.error('Error al guardar en Firestore:', dbError);
      this.errorMessage = 'No se pudo guardar la contribución. Contacta a soporte.';
    }
  }

  onCancel(): void {
    this.uploadSub?.unsubscribe();
    this.resetForm();
  }

  public resetForm(): void {
    this.isUploading = false;
    this.uploadProgress = 0;
    this.contributionForm.reset({
      contentType: 'image',
      videoInputMethod: 'upload',
      file: null,
      videoUrl: '',
      title: '',
      shuarTitle: '',
      description: '',
      shuarDescription: '',
      category: '',
      tags: '',
      contributor: '',
      location: '',
      culturalImportance: '',
      ageRestriction: 'all',
      permissions: false,
      respect: false,
    });

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
    }, 8000);
  }
}
