import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Quiz } from '../models/quiz';
import { Game, GameQuestion, GameStatus } from '../models/game';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  writeBatch,
  getDocs,
  updateDoc,
  arrayUnion,
  query,
  where,
  serverTimestamp,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  generateEntryCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createGame(quiz: Quiz, adminUid: string): Promise<string> {
    const batch = writeBatch(this.firestore);
    const gameRef = doc(collection(this.firestore, 'games'));
    const gameId = gameRef.id;

    batch.set(gameRef, {
      created: serverTimestamp(),
      quizId: quiz.id,
      currentQuestionIndex: 0,
      gameStatus: 'waiting' as GameStatus,
      adminId: adminUid,
      players: [adminUid],
      entryCode: this.generateEntryCode(),
    });

    quiz.questions.forEach((question, index) => {
      const qRef = doc(this.firestore, `games/${gameId}/questions/${question.id}`);
      batch.set(qRef, {
        text: question.text,
        choices: question.choices,
        correctChoiceIndex: question.correctChoiceIndex,
        order: index,
        playerAnswers: {},
      });
    });

    await batch.commit();
    return gameId;
  }

  getGameById(gameId: string): Observable<Game> {
    const gameDoc = doc(this.firestore, `games/${gameId}`);
    return runInInjectionContext(this.injector, () =>
      docData(gameDoc, { idField: 'id' }) as Observable<Game>
    );
  }

  getGameQuestions(gameId: string): Observable<GameQuestion[]> {
    const questionsCol = collection(this.firestore, `games/${gameId}/questions`);
    return runInInjectionContext(this.injector, () =>
      (collectionData(questionsCol, { idField: 'id' }) as Observable<GameQuestion[]>).pipe(
        map((questions) => questions.sort((a, b) => a.order - b.order))
      )
    );
  }

  async findGameByEntryCode(code: string): Promise<Game | null> {
    const gamesCol = collection(this.firestore, 'games');
    const q = query(
      gamesCol,
      where('entryCode', '==', code),
      where('gameStatus', '==', 'waiting')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Game;
  }

  async joinGame(gameId: string, uid: string): Promise<void> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    await updateDoc(gameRef, { players: arrayUnion(uid) });
  }

  async startGame(gameId: string): Promise<void> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    await updateDoc(gameRef, { gameStatus: 'in_game' as GameStatus });
  }

  async nextQuestion(gameId: string, newIndex: number): Promise<void> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    await updateDoc(gameRef, { currentQuestionIndex: newIndex });
  }

  async finishGame(gameId: string): Promise<void> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    await updateDoc(gameRef, { gameStatus: 'finished' as GameStatus });
  }

  async submitAnswer(gameId: string, questionId: string, uid: string, choiceIndex: number): Promise<void> {
    const qRef = doc(this.firestore, `games/${gameId}/questions/${questionId}`);
    await updateDoc(qRef, { [`playerAnswers.${uid}`]: choiceIndex });
  }
}
