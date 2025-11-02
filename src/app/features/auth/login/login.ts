import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';
  passwordFieldType: string = 'password';
  loginError: string | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);

  async login() {
    this.loginError = null;
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        this.loginError = 'El correo electrónico o la contraseña son incorrectos.';
      } else {
        this.loginError = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
      }
      console.error('Error al iniciar sesión:', error);
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      this.loginError = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
    }
  }

  togglePasswordVisibility() {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
}
