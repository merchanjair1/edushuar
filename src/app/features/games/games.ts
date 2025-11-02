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
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './games.html',
  styleUrls: ['./games.scss']
})
export class Games implements OnInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);
  private userStatsSubscription!: Subscription;

  selectedGame: GameAndLesson | null = null;
  selectedGameUrl: SafeResourceUrl | null = null;
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

  games$: Observable<GameAndLesson[]>;
  displayGames$: Observable<GameAndLesson[]>;
  private userStats$: Observable<UserStats>;
  totalGames = 0;
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

    const gamesCollection = collection(this.firestore, 'games_and_lessons');
    const gamesQuery = query(gamesCollection, where('category', '==', 'juego'));
    this.games$ = collectionData(gamesQuery, { idField: 'id' }) as Observable<GameAndLesson[]>;

    this.displayGames$ = combineLatest([
      this.games$,
      this.userStats$.pipe(map(userStats => userStats ? userStats.completedGameIds : []))
    ]).pipe(
      map(([games, completedGameIds]) => {
        this.totalGames = games.length;
        return games.map(game => ({
          ...game,
          completed: completedGameIds.includes(game.id)
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

  selectGame(game: GameAndLesson): void {
    this.selectedGame = game;
    this.selectedGameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(game.link);
    this.showIframeModal = true;

    this.authService.user$.pipe(
      take(1),
      filter((user): user is User => !!user && !!user.uid),
      map(user => user.uid),
      switchMap(uid => {
        if (uid) {
          const currentStats = this.stats();
          if (!currentStats.completedGameIds.includes(game.id)) {
            const points = this.getPointsForDifficulty(game.difficulty);
            const updatedStats: Partial<UserStats> = {
              gamePoints: currentStats.gamePoints + points,
              completedGames: currentStats.completedGames + 1,
              completedGameIds: [...currentStats.completedGameIds, game.id],
            };

            const achievementIndex = currentStats.achievements.findIndex(a => a.level.toLowerCase() === game.difficulty.toLowerCase());
            if (achievementIndex > -1) {
              updatedStats.achievements = [...currentStats.achievements];
              if(updatedStats.achievements) {
                updatedStats.achievements[achievementIndex].count++;
              }
            } else {
              updatedStats.achievements = [...currentStats.achievements, { level: game.difficulty, count: 1 }];
            }

            this.stats.update(stats => ({ ...stats, ...updatedStats }));
            const userStatsDocRef = doc(this.firestore, `userStats/${uid}`);
            return setDoc(userStatsDocRef, updatedStats, { merge: true });
          }
        }
        return of(null);
      })
    ).subscribe({
      next: () => console.log('Estadísticas del juego actualizadas correctamente.'),
      error: (err) => {
        console.error('Error al actualizar las estadísticas del juego:', err);
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
    this.selectedGameUrl = null;
    this.selectedGame = null;
  }
}
