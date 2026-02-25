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

  quizModel = signal({
    title: '',
    description: '',
    questionText: '',
    choices: [
      { text: '' },
      { text: '' },
    ],
    correctChoiceIndex: 0,
  });

  choices = computed(() => this.quizModel().choices);
  correctChoiceIndex = computed(() => this.quizModel().correctChoiceIndex);
  filledChoices = computed(() =>
    this.quizModel().choices.filter((c) => c.text.trim().length > 0)
  );
  hasMinChoices = computed(() => this.filledChoices().length >= 2);
  hasEmptyChoices = computed(() =>
    this.quizModel().choices.some((c) => c.text.trim().length === 0)
  );
  hasCorrect = computed(() => {
    const { choices, correctChoiceIndex } = this.quizModel();
    if (correctChoiceIndex == null) return false;
    return (
      correctChoiceIndex >= 0 &&
      correctChoiceIndex < choices.length &&
      choices[correctChoiceIndex].text.trim().length > 0
    );
  });

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

    const newChoice: Choice = { text: '' };
    this.quizModel.set({
      ...current,
      choices: [...current.choices, newChoice],
    });
  }

  removeChoice(choiceIndex: number) {
    const current = this.quizModel();
    const newChoices = current.choices.filter((_, index) => index !== choiceIndex);
    let newCorrectChoiceIndex = current.correctChoiceIndex;

    if (newCorrectChoiceIndex === choiceIndex) {
      newCorrectChoiceIndex = 0;
    } else if (choiceIndex < newCorrectChoiceIndex) {
      newCorrectChoiceIndex -= 1;
    }

    if (newChoices.length === 0) {
      newCorrectChoiceIndex = 0;
    } else if (newCorrectChoiceIndex >= newChoices.length) {
      newCorrectChoiceIndex = newChoices.length - 1;
    }

    this.quizModel.set({
      ...current,
      choices: newChoices,
      correctChoiceIndex: newCorrectChoiceIndex,
    });
  }

  updateChoiceText(choiceIndex: number, text: string) {
    const current = this.quizModel();
    this.quizModel.set({
      ...current,
      choices: current.choices.map((choice, index) =>
        index === choiceIndex ? { ...choice, text } : choice
      ),
    });
  }

  setCorrect(choiceIndex: number) {
    const current = this.quizModel();
    this.quizModel.set({ ...current, correctChoiceIndex: choiceIndex });
  }

  confirm() {
    const data = this.quizModel();

    const filledChoices = data.choices.filter((c) => c.text.trim().length > 0);
    const hasMinChoices = filledChoices.length >= 2;
    const hasEmptyChoices = data.choices.some(
      (c) => c.text.trim().length === 0
    );
    const hasCorrect =
      data.correctChoiceIndex != null &&
      data.correctChoiceIndex >= 0 &&
      data.correctChoiceIndex < data.choices.length &&
      data.choices[data.correctChoiceIndex].text.trim().length > 0;

    if (!hasMinChoices || !hasCorrect || hasEmptyChoices) {
      return;
    }

    const question: Question = {
      id: '1', // For the test only
      text: data.questionText.trim(),
      choices: filledChoices.map((choice) => ({ text: choice.text.trim() })),
      correctChoiceIndex: data.correctChoiceIndex,
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
