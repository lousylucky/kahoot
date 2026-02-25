import { TestBed } from '@angular/core/testing';
import { QuizService } from './quizService';


describe('Quiz', () => {
  let service: QuizService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
