import { Choice } from './choice';

export type GameStatus = 'waiting' | 'in_game' | 'finished';

export interface Game {
  id: string;
  created: Date;
  quizId: string;
  currentQuestionIndex: number;
  gameStatus: GameStatus;
  adminId: string;
  players: string[];
  entryCode: string;
}

export interface GameQuestion {
  id: string;
  text: string;
  choices: Choice[];
  correctChoiceIndex: number;
  order: number;
  playerAnswers: { [uid: string]: number };
}
