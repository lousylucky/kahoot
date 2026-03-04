import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./main.component').then((m) => m.MainComponent),
    children: [
      {
        path: 'quizzes',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'join-game',
        loadComponent: () => import('./pages/join-game/join-game.page').then((m) => m.JoinGamePage),
      },
      {
        path: '',
        redirectTo: 'quizzes',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'play-quiz/:id',
    loadComponent: () => import('./pages/play-quiz/play-quiz.page').then((m) => m.PlayQuizPage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage),
  },
];
