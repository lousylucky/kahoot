import { Question } from './question';

export interface Quiz {
  id: string;
  admin: string;
  createdAt: number;
  title: string;
  description: string;
  questions: Question[];
  questionsCount?: number;
}