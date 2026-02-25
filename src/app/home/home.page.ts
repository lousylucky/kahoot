import { Component, OnInit, inject, signal } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { QuizService } from '../services/quizService';
import { Quiz } from '../models/quiz';
import { AddQuizModalComponent } from '../components/add-quiz-modal/add-quiz-modal.component';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

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
  }

  async ngOnInit() {
    const data = await this.quizService.getAll();
    this.quizzes.set(data);
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: AddQuizModalComponent,
    });
    
    await modal.present();

    // Oczekiwanie na zamknięcie modala
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      const newQuiz: Quiz = {
        ...data,
        // id: Date.now() // For the test only
        id: ''
      };

      await this.quizService.addQuiz(newQuiz)
    
      this.quizzes.update(current => [...current, newQuiz]);
    }
  }
}
// Icone i formulaire ze storny ? 
