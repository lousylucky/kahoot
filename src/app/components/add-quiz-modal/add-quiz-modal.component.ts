// import { Component, inject, signal } from '@angular/core';
// import { IonicModule, ModalController } from '@ionic/angular';
// import { FormsModule } from '@angular/forms';
// import { form, required, FormField } from '@angular/forms/signals';

// @Component({
//   selector: 'app-add-quiz-modal',
//   standalone: true,
//   imports: [IonicModule, FormsModule, FormField],
//   templateUrl: './add-quiz-modal.component.html',
//   styleUrls: ['./add-quiz-modal.component.scss'],
// })
// export class AddQuizModalComponent {
//   private modalCtrl = inject(ModalController);

//   quizModel = signal({
//     title: '',
//     description: '',
//   });

//   quizForm = form(this.quizModel, (path) => {
//     required(path.title, { message: 'Title is required' });
//     required(path.description, { message: 'Description is required' });
//   });

//   cancel() {
//     return this.modalCtrl.dismiss(null, 'cancel');
//   }

//   confirm() {
//     const data = this.quizModel();
//     this.modalCtrl.dismiss({ ...data, questions: [] }, 'confirm');
//   }
// }

import { Component, inject, signal, computed } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';
import type { Question } from '../../models/question';

interface QuestionDraft {
  text: string;
  choices: { text: string }[];
  correctChoiceIndex: number;
}

function emptyQuestion(): QuestionDraft {
  return { text: '', choices: [{ text: '' }, { text: '' }], correctChoiceIndex: 0 };
}

@Component({
  selector: 'app-add-quiz-modal',
  standalone: true,
  imports: [IonicModule, FormsModule, FormField],
  templateUrl: './add-quiz-modal.component.html',
  styleUrls: ['./add-quiz-modal.component.scss'],
})
export class AddQuizModalComponent {
  private modalCtrl = inject(ModalController);

  readonly MAX_CHOICES = 5;

  quizModel = signal({
    title: '',
    description: '',
    questions: [emptyQuestion()] as QuestionDraft[],
  });

  quizForm = form(this.quizModel, (path) => {
    required(path.title, { message: 'Title is required' });
    required(path.description, { message: 'Description is required' });
  });

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

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
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

  confirm() {
    const data = this.quizModel();
    if (!this.allQuestionsValid()) return;

    const questions: Question[] = data.questions.map((q, i) => ({
      id: String(i + 1),
      text: q.text.trim(),
      choices: q.choices.map((c) => ({ text: c.text.trim() })),
      correctChoiceIndex: q.correctChoiceIndex,
    }));

    this.modalCtrl.dismiss(
      { title: data.title.trim(), description: data.description.trim(), questions },
      'confirm'
    );
  }
}
