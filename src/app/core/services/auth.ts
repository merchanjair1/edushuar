import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user, User, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { updateDoc } from '@angular/fire/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'student';
  createdAt: Date;
  lastActive: Date;
  isActive: boolean;
  avatar: string | null;
}

export interface UserStats {
  totalPoints: number;
  completedGames: number;
  completedGameIds: string[]; // New field
  achievements: { level: string; count: number; }[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  readonly user$: Observable<User | null> = user(this.auth);

  getUserProfile(uid: string): Observable<UserProfile | undefined> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return docData(userDocRef) as Observable<UserProfile | undefined>;
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  logout() {
    return signOut(this.auth);
  }

  getCurrentUserDisplayName(): string | null {
    return this.auth.currentUser ? this.auth.currentUser.displayName : null;
  }
  

  async updateUser(profileData: Partial<UserProfile>): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('No authenticated user');
  
    const userDocRef = doc(this.firestore, `users/${uid}`);
  
    // 🔹 Limpiar campos undefined o null y convertir null a undefined para Firestore
    const cleanData: Partial<UserProfile> = Object.fromEntries(
      Object.entries(profileData)
        .map(([key, value]) => {
          if (value === null) return [key, undefined]; // null → undefined
          return [key, value];
        })
        .filter(([_, value]) => value !== undefined) // quitar campos undefined
    );
  
    await updateDoc(userDocRef, cleanData);
  }
  
  async updateUserStats(uid: string, stats: Partial<UserStats>): Promise<void> {
    const userStatsDocRef = doc(this.firestore, `userStats/${uid}`);
    await updateDoc(userStatsDocRef, stats);
  }

  getUserStats(uid: string): Observable<UserStats | undefined> {
    const userStatsDocRef = doc(this.firestore, `userStats/${uid}`);
    return docData(userStatsDocRef) as Observable<UserStats | undefined>;
  }
  
}
