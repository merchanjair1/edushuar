import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Auth, user } from '@angular/fire/auth';
import { AuthService } from '../../core/services/auth';
import { UserProfile } from '../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, AsyncPipe],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  private auth: Auth = inject(Auth);
  private authService = inject(AuthService);
  private router = inject(Router);

  public isDropdownOpen = false;
  public userRole: 'admin' | 'student' | null = null;

  user$ = user(this.auth);

  ngOnInit(): void {
    this.user$.subscribe(user => {
      if (user) {
        this.authService.getUserProfile(user.uid).subscribe(profile => {
          this.userRole = profile?.role || null;
        });
      } else {
        this.userRole = null;
      }
    });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  public toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
}
