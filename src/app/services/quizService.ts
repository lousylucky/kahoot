import { Injectable, inject } from '@angular/core';
import { Quiz } from '../models/quiz';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { firstValueFrom, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class QuizService {
//   private quizzes: Quiz[] = [
//   {
//     id: 1,
//     title: 'TypeScript Basics',
//     description: 'Test your knowledge of typing in Angular.',
//     questions: [
//       {
//         id: 101,
//         text: 'Which TypeScript type means no value is assigned?',
//         choices: [
//           { id: 1, text: 'string' },
//           { id: 2, text: 'void' },
//           { id: 3, text: 'undefined' },
//         ],
//         correctChoiceId: 3,
//       },
//       {
//         id: 102,
//         text: 'Angular is mainly built using:',
//         choices: [
//           { id: 4, text: 'Java' },
//           { id: 5, text: 'TypeScript' },
//           { id: 6, text: 'Python' },
//         ],
//         correctChoiceId: 5,
//       },
//     ],
//   },
//   // --- QUIZ 2: Film history ---
//   {
//     id: 2,
//     title: 'World Cinema',
//     description: 'Are you a true movie lover?',
//     questions: [
//       {
//         id: 201,
//         text: 'Who directed the movie "Inception"?',
//         choices: [
//           { id: 7, text: 'Steven Spielberg' },
//           { id: 8, text: 'Christopher Nolan' },
//           { id: 9, text: 'Quentin Tarantino' },
//         ],
//         correctChoiceId: 8,
//       },
//     ],
//   },
//   // --- QUIZ 3: Geography ---
//   {
//     id: 3,
//     title: 'World Capitals',
//     description: 'A short test of country knowledge.',
//     questions: [
//       {
//         id: 301,
//         text: 'What is the capital of France?',
//         choices: [
//           { id: 10, text: 'Berlin' },
//           { id: 11, text: 'Madrid' },
//           { id: 12, text: 'Paris' },
//         ],
//         correctChoiceId: 12,
//       },
//     ],
//   },
// ]
  constructor() {}

  private firestore: Firestore = inject(Firestore);
  private quizzesRef = collection(this.firestore, 'quizzes');


  async getAll(): Promise<Quiz[]> {
    return firstValueFrom(
      collectionData(this.quizzesRef, { idField: 'id' }) as Observable<Quiz[]>
    );
    // return [...this.quizzes];
  }

  async get(quizId: number): Promise<Quiz> {
        const ref = doc(this.firestore, `quizzes/${quizId}`);
    const quiz = await firstValueFrom(
      docData(ref, { idField: 'id' }) as Observable<Quiz>
    );
    if (!quiz) throw new Error(`Quiz not found: ${quizId}`);
    return quiz;


    // const quiz = this.quizzes.find((q) => q.id === quizId);
    // if (!quiz) throw new Error(`Quiz not found: ${quizId}`);
    // return quiz;
  }

  async addQuiz(quiz: Quiz): Promise<Quiz> {
    // this.quizzes = [...this.quizzes, quiz];
    // return quiz;
        const { id, ...payload } = quiz;
    const docRef = await addDoc(this.quizzesRef, payload);
    return { ...quiz, id: docRef.id };
  }

  async deleteQuiz(quizId: string): Promise<void> {
    // const id = Number(quizId);
    // this.quizzes = this.quizzes.filter((q) => q.id !== id);
        await deleteDoc(doc(this.firestore, `quizzes/${quizId}`));

  }

  async updateQuiz(updatedQuiz: Quiz): Promise<Quiz> {
    // const index = this.quizzes.findIndex((q) => q.id === updatedQuiz['id']);
    // if (index === -1)
    //   throw new Error(`Could not find a quiz with given id: ${updatedQuiz.id}`);

    // this.quizzes[index] = { ...updatedQuiz };
    // return this.quizzes[index];
        const { id, ...payload } = updatedQuiz;
    await updateDoc(doc(this.firestore, `quizzes/${id}`), payload);
    return updatedQuiz;
  }
}
