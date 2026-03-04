import { ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, runInInjectionContext } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonIcon,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { Quiz } from '../../models/quiz';
import { Question } from '../../models/question';
import { QuizService } from '../../services/quizService';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-play-quiz',
  templateUrl: './play-quiz.page.html',
  styleUrls: ['./play-quiz.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonLabel,
    IonIcon,
    IonProgressBar,
    CommonModule,
    FormsModule,
  ],
})
export class PlayQuizPage implements OnInit, OnDestroy, ViewWillEnter {
  quiz?: Quiz;
  currentQuestionIndex = 0;
  selectedAnswers: { [key: string]: number } = {};
  score = 0;
  quizFinished = false;
  private quizSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private injector: Injector,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({ chevronBack, chevronForward, checkmarkCircle });
  }

  ngOnInit() {
    // initial load handled by ionViewWillEnter
  }

  ionViewWillEnter() {
    this.quizSub?.unsubscribe();
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
    this.score = 0;
    this.quizFinished = false;
    this.quiz = undefined;
    const quizId = this.route.snapshot.paramMap.get('id');
    if (quizId) {
      this.quizSub = runInInjectionContext(this.injector, () =>
        this.quizService.getById(quizId).subscribe({
          next: (quiz) => { this.quiz = quiz; this.cdr.detectChanges(); },
          error: (err) => console.error('Erreur lors du chargement du quiz:', err),
        })
      );
    }
  }

  ngOnDestroy() {
    this.quizSub?.unsubscribe();
  }

  get currentQuestion(): Question | undefined {
    return this.quiz?.questions[this.currentQuestionIndex];
  }

  get progress(): number {
    if (!this.quiz) return 0;
    return (this.currentQuestionIndex + 1) / this.quiz.questions.length;
  }

  selectAnswer(choiceId: number) {
    if (this.currentQuestion) {
      this.selectedAnswers[this.currentQuestion.id] = choiceId;
    }
  }

  nextQuestion() {
    if (
      this.quiz &&
      this.currentQuestionIndex < this.quiz.questions.length - 1
    ) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  finishQuiz() {
    if (!this.quiz) return;

    this.score = 0;
    this.quiz.questions.forEach((question) => {
      if (this.selectedAnswers[question.id] === question.correctChoiceIndex) {
        this.score++;
      }
    });

    this.quizFinished = true;
  }

  restartQuiz() {
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
    this.score = 0;
    this.quizFinished = false;
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
