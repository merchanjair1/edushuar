import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../core/services/auth';
import { CloudinaryApi } from "../../core/services/cloudinary-api";
import { User } from '@angular/fire/auth';
import { firstValueFrom, of } from 'rxjs';
import { switchMap, map, filter } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  activeTab: string = 'perfil';
  isEditing: boolean = false;
  selectedFile: File | null = null;
  avatarPreview: string | null = null;

  private authService = inject(AuthService);
  private cloudinaryService = inject(CloudinaryApi);
  private router = inject(Router);

  user: any = {};
  originalUser: any = {};

  ngOnInit(): void {
    this.authService.user$.pipe(
      switchMap(userAuth => {
        if (userAuth) {
          return this.authService.getUserProfile(userAuth.uid).pipe(
            map(userProfile => {
              const profile: Partial<UserProfile> = userProfile || {};
              return {
                uid: userAuth.uid,
                displayName: profile.displayName || userAuth.displayName || 'Usuario',
                email: userAuth.email,
                avatar: profile.avatar || userAuth.photoURL || null,
                role: profile.role || 'Estudiante',
                createdAt: profile.createdAt,
                lastActive: profile.lastActive,
                isActive: profile.isActive
              };
            })
          );
        } else {
          return of(null);
        }
      })
    ).subscribe(fullUser => {
      if (fullUser) {
        this.user = { ...fullUser };
        this.originalUser = { ...fullUser };
        this.avatarPreview = fullUser.avatar;
      } else {
        this.user = {};
        this.originalUser = {};
        this.avatarPreview = null;
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleEditMode() {
    if (!this.isEditing) {
      this.originalUser = { ...this.user };
    }
    this.isEditing = !this.isEditing;
  }

  onFileSelected(event: any): void {
    const file: File | undefined = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        this.avatarPreview = typeof result === 'string' ? result : null;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.avatarPreview = this.user.avatar ?? null;
    }
  }

  async saveProfile() {
    let avatarUrl: string | null = this.user.avatar;

    if (this.selectedFile) {
      try {
        const response: any = await firstValueFrom(
          this.cloudinaryService.upload(this.selectedFile).pipe(
            filter(result => result.url !== undefined || result.error !== undefined)
          )
        );
        avatarUrl = response.url || null;
        if (!avatarUrl) {
          console.error('No URL returned from Cloudinary. Response:', response);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        avatarUrl = null;
      }
    }

    if (avatarUrl === undefined) {
      avatarUrl = null;
    }

    const profileData: Partial<UserProfile> = {
      displayName: this.user.displayName,
      avatar: avatarUrl,
      email: this.user.email
    };

    console.log('Saving profile with avatarUrl:', avatarUrl);

    try {
      await this.authService.updateUser(profileData);
      this.user.avatar = avatarUrl;
      this.originalUser.avatar = avatarUrl;
      this.avatarPreview = avatarUrl;
      this.isEditing = false;
      this.selectedFile = null;
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  }

  cancelEdit() {
    this.user = { ...this.originalUser };
    this.isEditing = false;
    this.avatarPreview = this.user.avatar;
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}