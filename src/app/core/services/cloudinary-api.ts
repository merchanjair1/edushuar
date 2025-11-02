import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CloudinaryUploadResult {
  progress: number;
  url?: string;
  error?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryApi {
  private http = inject(HttpClient);

  private cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/upload`;
  private uploadPreset = environment.cloudinary.uploadPreset;

  /**
   * Sube un archivo a Cloudinary y reporta el progreso.
   * @param file El archivo a subir (imagen, video, audio, etc.).
   * @returns Un Observable que emite objetos CloudinaryUploadResult con el progreso (0-100)
   * y finalmente la URL segura del archivo subido.
   */
  upload(file: File): Observable<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post(this.cloudinaryUploadUrl, formData, {
      observe: 'events',
      reportProgress: true,
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * (event.loaded / (event.total || 1)));
          return { progress };
        }
        if (event.type === HttpEventType.Response) {
          const body: any = event.body;
          const url = body?.secure_url || body?.url || null; // soporta diferentes formatos
          if (!url) {
            console.error('Cloudinary response body did not contain a valid URL:', body);
          }
          return { progress: 100, url };
        }
        return { progress: 0 }; // Para otros tipos de eventos
      }),
      catchError(error => {
        console.error('Error en la subida a Cloudinary:', error);
        return of({ progress: 0, error: error });
      })
    );
  }
}