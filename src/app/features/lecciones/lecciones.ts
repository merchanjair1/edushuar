import { Component, inject, OnInit, OnDestroy, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Firestore, collection, query, where, collectionData, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable, of, combineLatest, Subscription } from 'rxjs';
import { map, switchMap, take, filter, shareReplay } from 'rxjs/operators';
import { AuthService, UserStats as BaseUserStats } from '../../core/services/auth';
import { User } from '@angular/fire/auth';

export interface GameAndLesson {
  id: string;
  name: string;
  description: string;
  link: string;
  difficulty: string;
  category: string;
  completed?: boolean;
}

export interface UserStats extends BaseUserStats {
  completedLessons: number;
  completedLessonIds: string[];
  gamePoints: number;
  lessonPoints: number;
}

@Component({
  selector: 'app-lecciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lecciones.html',
  styleUrls: ['./lecciones.scss']
})
export class Lecciones implements OnInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);
  private userStatsSubscription!: Subscription;

  selectedLesson: GameAndLesson | null = null;
  selectedLessonUrl: SafeResourceUrl | null = null;
  showIframeModal = false;

  stats: WritableSignal<UserStats> = signal({
    totalPoints: 0,
    completedGames: 0,
    completedGameIds: [],
    completedLessons: 0,
    completedLessonIds: [],
    gamePoints: 0,
    lessonPoints: 0,
    achievements: [
      { level: 'Básico', count: 0 },
      { level: 'Intermedio', count: 0 },
      { level: 'Avanzado', count: 0 },
    ]
  });

  lecciones$: Observable<GameAndLesson[]>;
  displayLecciones$: Observable<GameAndLesson[]>;
  private userStats$: Observable<UserStats>;
  totalLecciones = 0;
  objectKeys = Object.keys;

  constructor() {
    this.userStats$ = this.authService.user$.pipe(
      switchMap(user => {
        if (user?.uid) {
          const userStatsDocRef = doc(this.firestore, `userStats/${user.uid}`);
          return docData(userStatsDocRef).pipe(
            map(stats => {
              const baseStats = stats as BaseUserStats;
              if (baseStats) {
                return {
                  ...baseStats,
                  completedGames: baseStats.completedGames || 0,
                  completedGameIds: baseStats.completedGameIds || [],
                  completedLessons: (stats as any).completedLessons || 0,
                  completedLessonIds: (stats as any).completedLessonIds || [],
                  gamePoints: (stats as any).gamePoints || 0,
                  lessonPoints: (stats as any).lessonPoints || 0,
                } as UserStats;
              }
              return {
                totalPoints: 0,
                completedGames: 0,
                completedGameIds: [],
                completedLessons: 0,
                completedLessonIds: [],
                gamePoints: 0,
                lessonPoints: 0,
                achievements: []
              } as UserStats;
            })
          );
        } else {
          return of({
            totalPoints: 0,
            completedGames: 0,
            completedGameIds: [],
            completedLessons: 0,
            completedLessonIds: [],
            gamePoints: 0,
            lessonPoints: 0,
            achievements: []
          } as UserStats);
        }
      }),
      shareReplay(1)
    );

    const leccionesCollection = collection(this.firestore, 'games_and_lessons');
    const leccionesQuery = query(leccionesCollection, where('category', '==', 'leccion'));
    this.lecciones$ = collectionData(leccionesQuery, { idField: 'id' }) as Observable<GameAndLesson[]>;

    this.displayLecciones$ = combineLatest([
      this.lecciones$,
      this.userStats$.pipe(map(userStats => userStats ? userStats.completedLessonIds : []))
    ]).pipe(
      map(([lessons, completedLessonIds]) => {
        this.totalLecciones = lessons.length;
        return lessons.map(lesson => ({
          ...lesson,
          completed: completedLessonIds ? completedLessonIds.includes(lesson.id) : false
        }));
      })
    );
  }

  ngOnInit(): void {
    this.userStatsSubscription = this.userStats$.subscribe(userStats => {
      if (userStats) {
        this.stats.set(userStats);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userStatsSubscription) {
      this.userStatsSubscription.unsubscribe();
    }
  }

  selectLesson(lesson: GameAndLesson): void {
    this.selectedLesson = lesson;
    this.selectedLessonUrl = this.sanitizer.bypassSecurityTrustResourceUrl(lesson.link);
    this.showIframeModal = true;

    this.authService.user$.pipe(
      take(1),
      filter((user): user is User => !!user && !!user.uid),
      map(user => user.uid),
      switchMap(uid => {
        if (uid) {
          const currentStats = this.stats();
          if (!currentStats.completedLessonIds.includes(lesson.id)) {
            const points = this.getPointsForDifficulty(lesson.difficulty);
            const updatedStats: Partial<UserStats> = {
              lessonPoints: currentStats.lessonPoints + points,
              completedLessons: currentStats.completedLessons + 1,
              completedLessonIds: [...currentStats.completedLessonIds, lesson.id],
            };

            const achievementIndex = currentStats.achievements.findIndex(a => a.level.toLowerCase() === lesson.difficulty.toLowerCase());
            if (achievementIndex > -1) {
              updatedStats.achievements = [...currentStats.achievements];
              if(updatedStats.achievements){
                updatedStats.achievements[achievementIndex].count++;
              }
            } else {
              updatedStats.achievements = [...currentStats.achievements, { level: lesson.difficulty, count: 1 }];
            }

            this.stats.update(stats => ({ ...stats, ...updatedStats }));
            const userStatsDocRef = doc(this.firestore, `userStats/${uid}`);
            return setDoc(userStatsDocRef, updatedStats, { merge: true });
          }
        }
        return of(null);
      })
    ).subscribe({
      next: () => console.log('Estadísticas de la lección actualizadas correctamente.'),
      error: (err) => {
        console.error('Error al actualizar las estadísticas de la lección:', err);
      }
    });
  }

  getPointsForDifficulty(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
      case 'básico':
      case 'basico': return 10;
      case 'intermedio':
      case 'medio': return 20;
      case 'avanzado': return 30;
      default: return 0;
    }
  }

  closeIframeModal(): void {
    this.showIframeModal = false;
    this.selectedLessonUrl = null;
    this.selectedLesson = null;
  }
}

