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
    path: 'add-quiz',
    loadComponent: () => import('./components/add-quiz-modal/add-quiz-modal.component').then((m) => m.AddQuizModalComponent),
    canActivate: [authGuard],
  },
  {
    path: 'game-lobby/:id',
    loadComponent: () => import('./pages/game-lobby/game-lobby.page').then((m) => m.GameLobbyPage),
    canActivate: [authGuard],
  },
  {
    path: 'play-quiz/:id',
    loadComponent: () => import('./pages/play-quiz/play-quiz.page').then((m) => m.PlayQuizPage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'password-retrieve',
    loadComponent: () => import('./pages/auth/password-retrieve/password-retrieve.page').then(m => m.PasswordRetrievePage),
  },
];
