import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, chevronForwardOutline, createOutline, personCircleOutline, playOutline } from 'ionicons/icons';
import { filter, take } from 'rxjs/operators';
import { Quiz } from '../models/quiz';
import { Game } from '../models/game';
import { GameService } from '../services/game.service';
import { QuizService } from '../services/quizService';
import { UserService } from '../services/user.service';

interface ActiveGame extends Game {
  adminAlias?: string;
  quizTitle?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone: true,
  styleUrls: ['home.page.scss'],
  imports: [
    IonBadge,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonFab,
    IonFabButton,
  ],
})
export class HomePage implements OnInit {
  quizzes = signal<Quiz[]>([]);
  alias = signal<string>('');
  activeGames = signal<ActiveGame[]>([]);

  private quizService = inject(QuizService);
  private userService = inject(UserService);
  private gameService = inject(GameService);
  private auth = inject(Auth);
  private router = inject(Router);

  constructor() {
    addIcons({ add, chevronForwardOutline, createOutline, personCircleOutline, playOutline });
  }

  ngOnInit() {
    this.quizService.getAll().subscribe({
      next: (data) => this.quizzes.set(data),
      error: (error) => console.error('Quiz list load failed', error),
    });

    user(this.auth)
      .pipe(
        filter((u): u is NonNullable<typeof u> => !!u),
        take(1),
      )
      .subscribe({
        next: (u) => {
          this.userService.getById(u.uid).pipe(take(1)).subscribe({
            next: (userData) => {
              if (userData?.alias) {
                this.alias.set(userData.alias);
              }
            },
          });

          this.gameService.getActiveGamesForPlayer(u.uid).subscribe({
            next: (games) => {
              games.forEach((game, i) => {
                const ag = game as ActiveGame;

                this.userService.getById(game.adminId).pipe(take(1)).subscribe({
                  next: (adminData) => {
                    ag.adminAlias = adminData?.alias || 'Unknown';
                    this.activeGames.update((prev) => {
                      const copy = [...prev];
                      copy[i] = ag;
                      return copy;
                    });
                  },
                });

                this.quizService.getById(game.quizId).pipe(take(1)).subscribe({
                  next: (quiz) => {
                    ag.quizTitle = quiz?.title || 'Quiz';
                    this.activeGames.update((prev) => {
                      const copy = [...prev];
                      copy[i] = ag;
                      return copy;
                    });
                  },
                });
              });

              this.activeGames.set(games as ActiveGame[]);
            },
          });
        },
      });
  }

  gotoProfile() {
    this.router.navigateByUrl('/profile');
  }

  openAddQuiz() {
    this.router.navigateByUrl('/add-quiz');
  }

  editQuiz(event: MouseEvent, quizId: string) {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/edit-quiz', quizId]);
  }

  playGame(event: MouseEvent, quizId: string) {
    event.stopPropagation();
    event.preventDefault();

    const uid = this.auth.currentUser?.uid;
    if (!uid) return;

    this.quizService.getById(quizId).pipe(take(1)).subscribe(async (quiz) => {
      const gameId = await this.gameService.createGame(quiz, uid);
      this.router.navigate(['/game-lobby', gameId]);
    });
  }

  resumeGame(game: ActiveGame) {
    this.router.navigate(['/play-quiz', game.id], { queryParams: { mode: 'multiplayer' } });
  }
}
