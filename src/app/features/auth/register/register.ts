import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Firestore, collection, setDoc, doc } from '@angular/fire/firestore';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  email = '';
  password = '';
  confirmPassword = '';
  displayName = '';
  errorMessage = '';

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private router = inject(Router);
  private authService = inject(AuthService);

  private adminEmails = ['admin1@example.com', 'admin2@example.com', 'admin3@example.com'];

  async register() {
    this.errorMessage = '';
    if (!this.email || !this.password || !this.confirmPassword || !this.displayName) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: this.displayName });

      const userRole = this.adminEmails.includes(this.email) ? 'admin' : 'student';

      await setDoc(doc(this.firestore, "users", user.uid), {
        uid: user.uid,
        email: this.email,
        displayName: this.displayName,
        role: userRole,
        createdAt: new Date(),
        lastActive: new Date(),
        isActive: true,
      });

      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage = 'El correo electrónico ya está en uso.';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'La contraseña es demasiado débil.';
          break;
        default:
          this.errorMessage = 'Ocurrió un error inesperado al registrar el usuario.';
          break;
      }
      console.error('Error al registrar usuario:', error);
    }
  }

  async registerWithGoogle() {
    try {
      const userCredential = await this.authService.signInWithGoogle();
      const user = userCredential.user;

      const userRole = this.adminEmails.includes(user.email || '') ? 'admin' : 'student';

      await setDoc(doc(this.firestore, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userRole,
        createdAt: new Date(),
        lastActive: new Date(),
        isActive: true,
      });

      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error al registrar con Google:', error);
      this.errorMessage = 'No se pudo registrar con Google. Inténtalo de nuevo.';
    }
  }
}
