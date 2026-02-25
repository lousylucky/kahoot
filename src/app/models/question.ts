import { Choice } from './choice';

export interface Question {
  id: number;
  text: string;
  choices: Choice[];
  correctChoiceId: Choice['id'] | null;
}