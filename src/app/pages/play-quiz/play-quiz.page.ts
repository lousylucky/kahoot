import { ChangeDetectorRef, Component, inject, Injector, OnDestroy, OnInit, runInInjectionContext } from '@angular/core';
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
  IonIcon,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { Quiz } from '../../models/quiz';
import { Question } from '../../models/question';
import { Game, GameQuestion } from '../../models/game';
import { QuizService } from '../../services/quizService';
import { GameService } from '../../services/game.service';
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
  showingQuestionResult = false;

  // Multiplayer
  isMultiplayer = false;
  isAdmin = false;
  game?: Game;
  gameQuestions: GameQuestion[] = [];

  private quizSub?: Subscription;
  private gameSub?: Subscription;
  private gameQuestionsSub?: Subscription;

  private auth = inject(Auth);
  private gameService = inject(GameService);

  private readonly choiceSymbols = ['▲', '◆', '●', '■'];

 
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
    this.gameSub?.unsubscribe();
    this.gameQuestionsSub?.unsubscribe();
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
    this.score = 0;
    this.quizFinished = false;
    this.showingQuestionResult = false;
    this.quiz = undefined;
    this.game = undefined;
    this.isMultiplayer = false;
    this.isAdmin = false;

    const id = this.route.snapshot.paramMap.get('id');
    const mode = this.route.snapshot.queryParamMap.get('mode');
    this.isMultiplayer = mode === 'multiplayer';

    if (!id) return;

    if (this.isMultiplayer) {
      this.gameSub = runInInjectionContext(this.injector, () =>
        this.gameService.getGameById(id).subscribe((game) => {
          this.game = game;
          this.currentQuestionIndex = game.currentQuestionIndex;
          this.isAdmin = this.auth.currentUser?.uid === game.adminId;          this.showingQuestionResult = game.showingResult ?? false;          if (game.gameStatus === 'finished') {
            this.quizFinished = true;
          }
          this.cdr.detectChanges();
        })
      );
      this.gameQuestionsSub = runInInjectionContext(this.injector, () =>
        this.gameService.getGameQuestions(id).subscribe((questions) => {
          this.gameQuestions = questions;
          this.quiz = {
            id: id,
            title: 'Game',
            description: '',
            questions: questions,
            admin: this.game?.adminId ?? '',
            createdAt: this.game?.created ? new Date(this.game.created).getTime() : Date.now(),

          };
          this.cdr.detectChanges();
        })
      );
    } else {
      this.quizSub = runInInjectionContext(this.injector, () =>
        this.quizService.getById(id).subscribe({
          next: (quiz) => { this.quiz = quiz; this.cdr.detectChanges(); },
          error: (err) => console.error('Erreur lors du chargement du quiz:', err),
        })
      );
    }
  }

  ngOnDestroy() {
    this.quizSub?.unsubscribe();
    this.gameSub?.unsubscribe();
    this.gameQuestionsSub?.unsubscribe();
  }

  get currentQuestion(): Question | undefined {
    return this.quiz?.questions[this.currentQuestionIndex];
  }

  get progress(): number {
    if (!this.quiz) return 0;
    return (this.currentQuestionIndex + 1) / this.quiz.questions.length;
  }

  getChoiceSymbol(index: number): string {
    return this.choiceSymbols[index] ?? '●';
  }

  getVoteCount(questionId: string, choiceIndex: number): number {
    if (!this.isMultiplayer) {
      return this.selectedAnswers[questionId] === choiceIndex ? 1 : 0;
    }
    const gq = this.gameQuestions.find(q => q.id === questionId);
    if (!gq) return 0;
    return Object.values(gq.playerAnswers).filter(v => v === choiceIndex).length;
  }

  getTotalVotes(questionId: string): number {
    if (!this.isMultiplayer) return 1;
    const gq = this.gameQuestions.find(q => q.id === questionId);
    if (!gq) return 0;
    return Object.values(gq.playerAnswers).length;
  }

  getVotePercent(questionId: string, choiceIndex: number): number {
    const total = this.getTotalVotes(questionId);
    if (total === 0) return 0;
    return Math.round((this.getVoteCount(questionId, choiceIndex) / total) * 100);
  }


  selectAnswer(choiceIndex: number) {
    if (!this.currentQuestion) return;
    this.selectedAnswers[this.currentQuestion.id] = choiceIndex;

    if (this.isMultiplayer && this.game) {
      const uid = this.auth.currentUser?.uid;
      if (uid) {
        this.gameService.submitAnswer(this.game.id, this.currentQuestion.id, uid, choiceIndex);
      }
    }
  }

  nextQuestion() {
    if (!this.quiz) return;

    if (this.isMultiplayer && this.game && this.isAdmin) {
      if (!this.showingQuestionResult) {
        this.gameService.setShowingResult(this.game.id, true);
      } else {
        const newIndex = this.game.currentQuestionIndex + 1;
        if (newIndex < this.quiz.questions.length) {
          this.gameService.nextQuestion(this.game.id, newIndex);
        }
      }
      return;
    }

    // Solo mode
    if (!this.showingQuestionResult) {
      this.showingQuestionResult = true;
      this.cdr.detectChanges();
      return;
    }

    this.showingQuestionResult = false;
    if (this.currentQuestionIndex < this.quiz.questions.length - 1) {
      this.currentQuestionIndex++;
    }
    this.cdr.detectChanges();
  }

  previousQuestion() {
    if (!this.isMultiplayer && this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  finishQuiz() {
    if (!this.quiz) return;

    if (this.isMultiplayer && this.game && this.isAdmin) {
      if (!this.showingQuestionResult) {
        this.gameService.setShowingResult(this.game.id, true);
      } else {
        this.gameService.finishGame(this.game.id);
      }
      return;
    }

    // Solo mode
    if (!this.showingQuestionResult) {
      this.showingQuestionResult = true;
      this.cdr.detectChanges();
      return;
    }
    this.score = 0;
    this.quiz.questions.forEach((question) => {
      if (this.selectedAnswers[question.id] === question.correctChoiceIndex) {
        this.score++;
      }
    });
    this.quizFinished = true;
    this.cdr.detectChanges();
  }

  restartQuiz() {
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
    this.score = 0;
    this.quizFinished = false;
    this.showingQuestionResult = false;
  }

  goHome() {
    this.router.navigate(['/quizzes']);
  }
}
