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
import type { Choice } from '../../models/choice';
import type { Question } from '../../models/question';

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
  private nextChoiceId = 1;

  quizModel = signal({
    title: '',
    description: '',
    questionText: '',
    choices: [
      { id: 1, text: '' },
      { id: 2, text: '' },
    ],
    correctChoiceId: null as number | null,
  });

  choices = computed(() => this.quizModel().choices);
  correctChoiceId = computed(() => this.quizModel().correctChoiceId);
  filledChoices = computed(() =>
    this.quizModel().choices.filter((c) => c.text.trim().length > 0)
  );
  hasMinChoices = computed(() => this.filledChoices().length >= 2);
  hasEmptyChoices = computed(() =>
    this.quizModel().choices.some((c) => c.text.trim().length === 0)
  );
  hasCorrect = computed(() => {
    const id = this.quizModel().correctChoiceId;
    if (id == null) return false;
    return this.filledChoices().some((c) => c.id === id);
  });

  constructor() {
    this.nextChoiceId = 3;
  }

  quizForm = form(this.quizModel, (path) => {
    required(path.title, { message: 'Title is required' });
    required(path.description, { message: 'Description is required' });
    required(path.questionText, { message: 'Question text is required' });
  });

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  addChoice() {
    const current = this.quizModel();
    if (current.choices.length >= this.MAX_CHOICES) return;

    const newChoice: Choice = { id: this.nextChoiceId++, text: '' };
    this.quizModel.set({
      ...current,
      choices: [...current.choices, newChoice],
    });
  }

  removeChoice(choiceId: number) {
    const current = this.quizModel();
    const newChoices = current.choices.filter((c) => c.id !== choiceId);
    const newCorrect =
      current.correctChoiceId === choiceId ? null : current.correctChoiceId;

    this.quizModel.set({
      ...current,
      choices: newChoices,
      correctChoiceId: newCorrect,
    });
  }

  updateChoiceText(choiceId: number, text: string) {
    const current = this.quizModel();
    this.quizModel.set({
      ...current,
      choices: current.choices.map((c) =>
        c.id === choiceId ? { ...c, text } : c
      ),
    });
  }

  setCorrect(choiceId: number) {
    const current = this.quizModel();
    this.quizModel.set({ ...current, correctChoiceId: choiceId });
  }

  confirm() {
    const data = this.quizModel();

    const filledChoices = data.choices.filter((c) => c.text.trim().length > 0);
    const hasMinChoices = filledChoices.length >= 2;
    const hasEmptyChoices = data.choices.some(
      (c) => c.text.trim().length === 0
    );
    const hasCorrect =
      data.correctChoiceId != null &&
      filledChoices.some((c) => c.id === data.correctChoiceId);

    if (!hasMinChoices || !hasCorrect || hasEmptyChoices) {
      return;
    }

    const question: Question = {
      id: Date.now(),
      text: data.questionText.trim(),
      choices: filledChoices,
      correctChoiceId: data.correctChoiceId,
    };

    this.modalCtrl.dismiss(
      {
        title: data.title.trim(),
        description: data.description.trim(),
        questions: [question],
      },
      'confirm'
    );
  }
}
