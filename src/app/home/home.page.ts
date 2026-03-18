import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import {
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
import { add, chevronForwardOutline, createOutline, logOutOutline } from 'ionicons/icons';
import { filter, switchMap, take } from 'rxjs/operators';
import { Quiz } from '../models/quiz';
import { GameService } from '../services/game.service';
import { QuizService } from '../services/quizService';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone: true,
  styleUrls: ['home.page.scss'],
  imports: [
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

  private quizService = inject(QuizService);
  private userService = inject(UserService);
  private gameService = inject(GameService);
  private auth = inject(Auth);
  private router = inject(Router);

  constructor() {
    addIcons({ add, chevronForwardOutline, createOutline, logOutOutline });
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
        switchMap((u) => this.userService.getById(u.uid)),
        take(1)
      )
      .subscribe({
        next: (userData) => {
          if (userData?.alias) {
            this.alias.set(userData.alias);
          }
        },
      });
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

  async onLogout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
