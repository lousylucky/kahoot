import { Component, OnInit, inject, signal } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { QuizService } from '../services/quizService';
import { Quiz } from '../models/quiz';
import { AddQuizModalComponent } from '../components/add-quiz-modal/add-quiz-modal.component';
import { addIcons } from 'ionicons';
import { add, playOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone: true,
  imports: [IonicModule],
})
export class HomePage implements OnInit {
  quizzes = signal<Quiz[]>([]);

  private quizService = inject(QuizService);
  private modalCtrl = inject(ModalController);

  constructor() {
    // Rejestrujemy ikonę plusa
    addIcons({ add });
    addIcons({ playOutline });
  }

  ngOnInit() {
    this.quizService.getAll().subscribe((data) => {
      this.quizzes.set(data);
    });
    console.log(this.quizzes());
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: AddQuizModalComponent,
    });

    await modal.present();

    // Oczekiwanie na zamknięcie modala
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
}
// Icone i formulaire ze storny ?
