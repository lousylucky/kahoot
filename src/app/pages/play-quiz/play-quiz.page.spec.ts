import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayQuizPage } from './play-quiz.page';

describe('PlayQuizPage', () => {
  let component: PlayQuizPage;
  let fixture: ComponentFixture<PlayQuizPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayQuizPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
