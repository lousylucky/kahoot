import { Component, OnInit, inject, signal } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { QuizService } from '../services/quizService';
import { Quiz } from '../models/quiz';
import { AddQuizModalComponent } from '../components/add-quiz-modal/add-quiz-modal.component';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, playOutline, logOutOutline } from 'ionicons/icons';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone: true,
  imports: [IonicModule],
})
export class HomePage implements OnInit {
  quizzes = signal<Quiz[]>([]);
  alias = signal<string>('');

  private quizService = inject(QuizService);
  private modalCtrl = inject(ModalController);
  private userService = inject(UserService);

  constructor() {
    // Rejestrujemy ikonę plusa
    addIcons({ add });
    addIcons({ playOutline });
    addIcons({ add, logOutOutline });
  }
  private auth = inject(Auth);
  private router = inject(Router);

  ngOnInit() {
    this.quizService.getAll().subscribe((data) => {
      this.quizzes.set(data);
    });
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.userService.getById(currentUser.uid).subscribe((userData) => {
        if (userData?.alias) {
          this.alias.set(userData.alias);
        }
      });
    }
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

  async createGame(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
  }

  async playGame(event: MouseEvent, quizId: string) {
    event.stopPropagation();
    event.preventDefault();

    await this.router.navigate(['/play-quiz', quizId]);
  }

  // Icone i formulaire ze storny ?
  async onLogout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
