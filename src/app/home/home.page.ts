import { Component, OnInit, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { QuizService } from '../services/quizService';
import { Quiz } from '../models/quiz';
import { AddQuizModalComponent } from '../components/add-quiz-modal/add-quiz-modal.component';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, playOutline, logOutOutline } from 'ionicons/icons';
import { Auth, user } from '@angular/fire/auth';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonLabel,
    IonFab,
    IonFabButton,
  ],
})
export class HomePage implements OnInit {
  quizzes = signal<Quiz[]>([]);
  alias = signal<string>('');

  private quizService = inject(QuizService);
  private modalCtrl = inject(ModalController);
  private userService = inject(UserService);
  private gameService = inject(GameService);

  constructor() {
    // Rejestrujemy ikonę plusa
    addIcons({ add });
    addIcons({ playOutline });
    addIcons({ add, logOutOutline });
  }
  private auth = inject(Auth);
  private router = inject(Router);

  ngOnInit() {
    this.quizService.getAll().subscribe({
      next: (data) => {
        this.quizzes.set(data);
      },
      error: (error) => {
        console.error('Quiz list load failed', error);
      },
    });

    user(this.auth)
      .pipe(
        filter((currentUser): currentUser is NonNullable<typeof currentUser> => !!currentUser),
        take(1),
      )
      .subscribe({
        next: (currentUser) => {
          this.userService.getById(currentUser.uid).subscribe({
            next: (userData) => {
              if (userData?.alias) {
                this.alias.set(userData.alias);
              }
            },
            error: (error) => {
              console.error('User profile load failed', error);
            },
          });
        },
        error: (error) => {
          console.error('Auth state load failed', error);
        },
      });
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: AddQuizModalComponent,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      const quizId = this.quizService.generateQuizId();

      const newQuiz: Quiz = {
        ...data,
        id: quizId,
        questions: (data.questions ?? []).map(
          (question: Quiz['questions'][number]) => ({
            ...question,
            id:
              question.id && question.id.trim().length > 0
                ? question.id
                : this.quizService.generateQuestionId(quizId),
          }),
        ),
      };

      await this.quizService.setQuiz(newQuiz);
    }
  }

  async playGame(event: MouseEvent, quizId: string) {
    event.stopPropagation();
    event.preventDefault();

    const uid = this.auth.currentUser?.uid;
    if (!uid) return;

    this.quizService.getById(quizId).pipe(take(1)).subscribe(async (quiz) => {
      const gameId = await this.gameService.createGame(quiz, uid);
      this.router.navigate(['/game-lobby', gameId]);
    });
  }

  // Icone i formulaire ze storny ?
  async onLogout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
