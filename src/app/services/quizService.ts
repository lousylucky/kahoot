import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Question } from '../models/question';
import { Choice } from '../models/choice';
import {
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  Observable,
  switchMap,
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
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private firestore: Firestore = inject(Firestore);
  private injector: Injector = inject(Injector);
  private auth: Auth = inject(Auth);

  getAll(): Observable<Quiz[]> {
    const uid = this.auth.currentUser?.uid;
    const quizzesCollection = collection(this.firestore, 'quizzes');
    const userQuizzesQuery = query(quizzesCollection, where('admin', '==', uid ?? ''), orderBy('createdAt', 'desc'));

    const quizzes$ = runInInjectionContext(this.injector, () =>
      collectionData(userQuizzesQuery, { idField: 'id' }) as Observable<Quiz[]>
    );

    return quizzes$.pipe(
      mergeMap((quizzes) =>
        quizzes.length
          ? combineLatest(
              quizzes.map((quiz) => {
                const questionsCollection = collection(
                  this.firestore,
                  `quizzes/${quiz.id}/questions`,
                );

                return runInInjectionContext(this.injector, () =>
                  collectionCount(questionsCollection).pipe(
                    map((count) => ({
                      ...quiz,
                      questionsCount: count,
                    })),
                  )
                );
              }),
            )
          : [[] as Quiz[]],
      ),
    );
  }

  getById(id: string): Observable<Quiz> {
    const quizDoc = doc(this.firestore, `quizzes/${id}`);

    const quizData = runInInjectionContext(this.injector, () =>
      docData(quizDoc, { idField: 'id' }) as Observable<Quiz>
    );

    return quizData.pipe(
      switchMap((quiz) => this.assembleQuiz(quiz)),
    ) as Observable<Quiz>;
  }

  private assembleQuiz(quiz: Quiz): Observable<Quiz> {
    return runInInjectionContext(this.injector, () =>
      (collectionData(
        collection(doc(this.firestore, `quizzes/${quiz.id}`), 'questions'),
        { idField: 'id' },
      ) as Observable<Question[]>).pipe(
        map((questions) => ({
          ...quiz,
          questions,
        })),
      )
    );
  }

  async setQuiz(quiz: Quiz): Promise<void> {
    const batch = writeBatch(this.firestore);

    // Quiz (auto ID or provided ID — your choice)
    const quizRef = doc(this.firestore, 'quizzes', quiz.id);

    batch.set(quizRef, {
      title: quiz.title,
      description: quiz.description,
      admin: quiz.admin,
      createdAt: quiz.createdAt,
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