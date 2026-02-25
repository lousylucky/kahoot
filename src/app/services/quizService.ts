import { inject, Injectable } from '@angular/core';
import { Question } from '../models/question';
import { Choice } from '../models/choice';
import {
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  Observable,
  switchMap,
  tap,
} from 'rxjs';
import { Quiz } from '../models/quiz';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  collectionCount,
  setDoc,
  writeBatch,
  deleteDoc,
  getDocs,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private firestore: Firestore = inject(Firestore); // inject Cloud Firestore

  // ne pas oublier de faire un get avec un where car il faudra mettre une sercuriter sur règles de firebase
  getAll(): Observable<Quiz[]> {
  const quizzesCollection = collection(this.firestore, 'quizzes');

  const quizzes$ = collectionData(quizzesCollection, { idField: 'id' }) as Observable<Quiz[]>;

  return quizzes$.pipe(
    mergeMap((quizzes) =>
      quizzes.length
        ? combineLatest(
            quizzes.map((quiz) => {
              const questionsCollection = collection(
                this.firestore,
                `quizzes/${quiz.id}/questions`,
              );

              return collectionCount(questionsCollection).pipe(
                map((count) => ({
                  ...quiz,
                  questionsCount: count,
                })),
              );
            }),
          )
        : [ [] as Quiz[] ],
    ),
  );
}

  getById(id: string) {
    // get a reference to the quiz doc
    const quizDoc = doc(this.firestore, `quizzes/${id}`);

    // get document (data) from the doc using docData
    const quizData = docData(quizDoc, {
      idField: 'id',
    }) as Observable<Quiz>;

    return quizData.pipe(
      switchMap((quiz) => this.assembleQuiz(quiz)),
      tap(console.log),
    ) as Observable<Quiz>;
  }

  private assembleQuiz(quiz: Quiz): Observable<Quiz> {
    return (
      collectionData(
        collection(doc(this.firestore, `quizzes/${quiz.id}`), 'questions'),
        {
          idField: 'id',
        },
      ) as Observable<Question[]>
    ).pipe(
      map((questions) => ({
        ...quiz,
        questions: questions,
      })),
    );
  }

  async setQuiz(quiz: Quiz): Promise<void> {
    const batch = writeBatch(this.firestore);

    // Quiz (auto ID or provided ID — your choice)
    const quizRef = doc(this.firestore, 'quizzes', quiz.id);

    batch.set(quizRef, {
      title: quiz.title,
      description: quiz.description,
    });

    for (const question of quiz.questions) {
      const questionRef = doc(
        this.firestore,
        `quizzes/${quiz.id}/questions/${question.id}`,
      );

      batch.set(questionRef, {
        text: question.text,
        correctChoiceIndex: question.correctChoiceIndex,
        choices: question.choices,
      });
    }

    await batch.commit();
  }

  deleteQuiz(quizId: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `quizzes/${quizId}`));
  }

  generateQuizId(): string {
    return doc(collection(this.firestore, 'quizzes')).id;
  }

  generateQuestionId(quizId: string): string {
    const quizRef = doc(this.firestore, `quizzes/${quizId}`);
    return doc(collection(quizRef, 'questions')).id;
  }

  generateQuiz() {
    const quizId = this.generateQuizId();
    const questionId = this.generateQuestionId(quizId);
    const correctChoiceIndex = 0;
    return {
      id: quizId,
      title: 'Guess the Capital City',
      description: 'A fun quiz to test your knowledge of world capitals.',
      questions: [
        {
          id: questionId,
          text: 'What is the capital of France?',
          choices: [
            { text: 'Paris' },
            { text: 'London' },
            { text: 'Berlin' },
            { text: 'Madrid' },
          ],
          correctChoiceIndex,
        },
      ],
    };
  }
}