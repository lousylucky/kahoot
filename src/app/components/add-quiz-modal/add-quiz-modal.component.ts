import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonTextarea,
  IonNote,
  IonRadioGroup,
  IonRadio,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { take } from 'rxjs/operators';
import type { Question } from '../../models/question';
import type { Quiz } from '../../models/quiz';
import { AuthService } from '../../services/auth.service';
import { QuizService } from '../../services/quizService';

interface QuestionDraft {
  id?: string;
  text: string;
  choices: { text: string }[];
  correctChoiceIndex: number;
}

function emptyQuestion(): QuestionDraft {
  return {
    text: '',
    choices: [{ text: '' }, { text: '' }],
    correctChoiceIndex: 0,
  };
}

@Component({
  selector: 'app-add-quiz',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonNote,
    IonRadioGroup,
    IonRadio,
    IonIcon,
    IonSpinner,
    FormsModule,
    FormField,
  ],
  templateUrl: './add-quiz-modal.component.html',
  styleUrls: ['./add-quiz-modal.component.scss'],
})
export class AddQuizModalComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);
  private authService = inject(AuthService);

  readonly MAX_CHOICES = 5;

  quizModel = signal({
    title: '',
    description: '',
    questions: [emptyQuestion()] as QuestionDraft[],
  });
  editingQuizId = signal<string | null>(null);
  originalQuiz = signal<Quiz | null>(null);
  isLoadingQuiz = signal(false);

  quizForm = form(this.quizModel, (path) => {
    required(path.title, { message: 'Title is required' });
    required(path.description, { message: 'Description is required' });
  });

  submitted = signal(false);
  touchedQuestions = signal<Set<number>>(new Set());

  questions = computed(() => this.quizModel().questions);
  isEditMode = computed(() => this.editingQuizId() !== null);
  pageTitle = computed(() => (this.isEditMode() ? 'Edit Quiz' : 'New Quiz'));
  brandTitle = computed(() => (this.isEditMode() ? 'Edit Your Quiz' : 'Create a Quiz'));
  brandSubtitle = computed(() =>
    this.isEditMode()
      ? 'Update the details and save your changes'
      : 'Fill in the details and add your questions'
  );
  submitLabel = computed(() => (this.isEditMode() ? 'Update Quiz' : 'Create Quiz'));

  constructor() {
    addIcons({ arrowBackOutline });
  }

  ngOnInit() {
    const quizId = this.route.snapshot.paramMap.get('id');
    if (!quizId) {
      return;
    }

    this.editingQuizId.set(quizId);
    this.isLoadingQuiz.set(true);

    this.quizService.getById(quizId).pipe(take(1)).subscribe({
      next: (quiz) => {
        this.originalQuiz.set(quiz);
        this.quizModel.set({
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions.length
            ? quiz.questions.map((question) => ({
                id: question.id,
                text: question.text,
                choices: question.choices.map((choice) => ({ text: choice.text })),
                correctChoiceIndex: question.correctChoiceIndex,
              }))
            : [emptyQuestion()],
        });
        this.isLoadingQuiz.set(false);
      },
      error: (error) => {
        console.error('Quiz load failed', error);
        this.isLoadingQuiz.set(false);
        this.router.navigateByUrl('/quizzes');
      },
    });
  }

  hasEmptyChoices(q: QuestionDraft): boolean {
    return q.choices.some((c) => c.text.trim().length === 0);
  }

  questionValid(q: QuestionDraft): boolean {
    if (!q.text.trim()) return false;
    if (q.choices.some((c) => c.text.trim().length === 0)) return false;
    if (q.choices.length < 2) return false;
    const ci = q.correctChoiceIndex;
    return ci >= 0 && ci < q.choices.length && q.choices[ci].text.trim().length > 0;
  }

  allQuestionsValid = computed(() =>
    this.quizModel().questions.every((q) => this.questionValid(q))
  );

  markQuestionTouched(qIndex: number) {
    const current = new Set(this.touchedQuestions());
    current.add(qIndex);
    this.touchedQuestions.set(current);
  }

  cancel() {
    this.router.navigateByUrl('/quizzes');
  }

  addQuestion() {
    const current = this.quizModel();
    this.quizModel.set({
      ...current,
      questions: [...current.questions, emptyQuestion()],
    });
  }

  removeQuestion(qIndex: number) {
    const current = this.quizModel();
    if (current.questions.length <= 1) return;

    this.quizModel.set({
      ...current,
      questions: current.questions.filter((_, i) => i !== qIndex),
    });
  }

  updateQuestionText(qIndex: number, text: string) {
    const current = this.quizModel();
    this.quizModel.set({
      ...current,
      questions: current.questions.map((question, index) =>
        index === qIndex ? { ...question, text } : question
      ),
    });
  }

  addChoice(qIndex: number) {
    const current = this.quizModel();
    const question = current.questions[qIndex];
    if (question.choices.length >= this.MAX_CHOICES) return;

    const updatedQuestion = {
      ...question,
      choices: [...question.choices, { text: '' }],
    };

    this.quizModel.set({
      ...current,
      questions: current.questions.map((item, index) =>
        index === qIndex ? updatedQuestion : item
      ),
    });
  }

  removeChoice(qIndex: number, choiceIndex: number) {
    const current = this.quizModel();
    const question = current.questions[qIndex];
    const nextChoices = question.choices.filter((_, index) => index !== choiceIndex);

    let correctChoiceIndex = question.correctChoiceIndex;
    if (correctChoiceIndex === choiceIndex) correctChoiceIndex = 0;
    else if (choiceIndex < correctChoiceIndex) correctChoiceIndex -= 1;
    if (correctChoiceIndex >= nextChoices.length) {
      correctChoiceIndex = Math.max(nextChoices.length - 1, 0);
    }

    const updatedQuestion = {
      ...question,
      choices: nextChoices,
      correctChoiceIndex,
    };

    this.quizModel.set({
      ...current,
      questions: current.questions.map((item, index) =>
        index === qIndex ? updatedQuestion : item
      ),
    });
  }

  updateChoiceText(qIndex: number, choiceIndex: number, text: string) {
    const current = this.quizModel();
    const question = current.questions[qIndex];
    const updatedQuestion = {
      ...question,
      choices: question.choices.map((choice, index) =>
        index === choiceIndex ? { ...choice, text } : choice
      ),
    };

    this.quizModel.set({
      ...current,
      questions: current.questions.map((item, index) =>
        index === qIndex ? updatedQuestion : item
      ),
    });
  }

  setCorrect(qIndex: number, choiceIndex: number) {
    const current = this.quizModel();
    const question = current.questions[qIndex];
    const updatedQuestion = { ...question, correctChoiceIndex: choiceIndex };

    this.quizModel.set({
      ...current,
      questions: current.questions.map((item, index) =>
        index === qIndex ? updatedQuestion : item
      ),
    });
  }

  async confirm() {
    this.submitted.set(true);
    const data = this.quizModel();
    if (this.quizForm().invalid() || !this.allQuestionsValid()) return;

    const originalQuiz = this.originalQuiz();
    const quizId = this.editingQuizId() ?? this.quizService.generateQuizId();

    const questions: Question[] = data.questions.map((question) => ({
      id: question.id ?? this.quizService.generateQuestionId(quizId),
      text: question.text.trim(),
      choices: question.choices.map((choice) => ({ text: choice.text.trim() })),
      correctChoiceIndex: question.correctChoiceIndex,
    }));

    const quiz: Quiz = {
      id: quizId,
      title: data.title.trim(),
      description: data.description.trim(),
      admin: originalQuiz?.admin ?? this.authService.currentUserId() ?? '',
      createdAt: originalQuiz?.createdAt ?? Date.now(),
      questions,
    };

    await this.quizService.setQuiz(quiz);
    this.router.navigateByUrl('/quizzes');
  }
}
