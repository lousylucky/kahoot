import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
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
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import type { Question } from '../../models/question';
import type { Quiz } from '../../models/quiz';
import { QuizService } from '../../services/quizService';
import { AuthService } from '../../services/auth.service';

interface QuestionDraft {
  text: string;
  choices: { text: string }[];
  correctChoiceIndex: number;
}

function emptyQuestion(): QuestionDraft {
  return { text: '', choices: [{ text: '' }, { text: '' }], correctChoiceIndex: 0 };
}

@Component({
  selector: 'app-add-quiz',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
    IonItem, IonInput, IonTextarea, IonNote, IonRadioGroup, IonRadio, IonIcon,
    FormsModule, FormField,
  ],
  templateUrl: './add-quiz-modal.component.html',
  styleUrls: ['./add-quiz-modal.component.scss'],
})
export class AddQuizModalComponent {
  private router = inject(Router);
  private quizService = inject(QuizService);
  private authService = inject(AuthService);

  readonly MAX_CHOICES = 5;

  constructor() {
    addIcons({ arrowBackOutline });
  }

  quizModel = signal({
    title: '',
    description: '',
    questions: [emptyQuestion()] as QuestionDraft[],
  });

  quizForm = form(this.quizModel, (path) => {
    required(path.title, { message: 'Title is required' });
    required(path.description, { message: 'Description is required' });
  });

  submitted = signal(false);
  touchedQuestions = signal<Set<number>>(new Set());

  questions = computed(() => this.quizModel().questions);

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

  // ── Question-level ──────────────────────────────────────────────────────────

  addQuestion() {
    const current = this.quizModel();
    this.quizModel.set({ ...current, questions: [...current.questions, emptyQuestion()] });
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
      questions: current.questions.map((q, i) => (i === qIndex ? { ...q, text } : q)),
    });
  }

  // ── Choice-level ─────────────────────────────────────────────────────────────

  addChoice(qIndex: number) {
    const current = this.quizModel();
    const q = current.questions[qIndex];
    if (q.choices.length >= this.MAX_CHOICES) return;
    const updated = { ...q, choices: [...q.choices, { text: '' }] };
    this.quizModel.set({
      ...current,
      questions: current.questions.map((x, i) => (i === qIndex ? updated : x)),
    });
  }

  removeChoice(qIndex: number, choiceIndex: number) {
    const current = this.quizModel();
    const q = current.questions[qIndex];
    const newChoices = q.choices.filter((_, i) => i !== choiceIndex);
    let ci = q.correctChoiceIndex;
    if (ci === choiceIndex) ci = 0;
    else if (choiceIndex < ci) ci -= 1;
    if (newChoices.length === 0) ci = 0;
    else if (ci >= newChoices.length) ci = newChoices.length - 1;
    const updated = { ...q, choices: newChoices, correctChoiceIndex: ci };
    this.quizModel.set({
      ...current,
      questions: current.questions.map((x, i) => (i === qIndex ? updated : x)),
    });
  }

  updateChoiceText(qIndex: number, choiceIndex: number, text: string) {
    const current = this.quizModel();
    const q = current.questions[qIndex];
    const updated = {
      ...q,
      choices: q.choices.map((c, i) => (i === choiceIndex ? { ...c, text } : c)),
    };
    this.quizModel.set({
      ...current,
      questions: current.questions.map((x, i) => (i === qIndex ? updated : x)),
    });
  }

  setCorrect(qIndex: number, choiceIndex: number) {
    const current = this.quizModel();
    const q = current.questions[qIndex];
    const updated = { ...q, correctChoiceIndex: choiceIndex };
    this.quizModel.set({
      ...current,
      questions: current.questions.map((x, i) => (i === qIndex ? updated : x)),
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async confirm() {
    this.submitted.set(true);
    const data = this.quizModel();
    if (!this.allQuestionsValid()) return;

    const quizId = this.quizService.generateQuizId();

    const questions: Question[] = data.questions.map((q) => ({
      id: this.quizService.generateQuestionId(quizId),
      text: q.text.trim(),
      choices: q.choices.map((c) => ({ text: c.text.trim() })),
      correctChoiceIndex: q.correctChoiceIndex,
    }));

    const newQuiz: Quiz = {
      id: quizId,
      title: data.title.trim(),
      description: data.description.trim(),
      admin: this.authService.currentUserId() ?? '',
      createdAt: Date.now(),
      questions,
    };

    await this.quizService.setQuiz(newQuiz);
    this.router.navigateByUrl('/quizzes');
  }
}
