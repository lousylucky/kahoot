import { Component, inject, Injector, OnDestroy, OnInit, runInInjectionContext, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { GameService } from '../../services/game.service';
import { Game } from '../../models/game';

@Component({
  selector: 'app-game-lobby',
  templateUrl: './game-lobby.page.html',
  styleUrls: ['./game-lobby.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class GameLobbyPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gameService = inject(GameService);
  private auth = inject(Auth);
  private injector = inject(Injector);

  game = signal<Game | undefined>(undefined);
  private gameSub?: Subscription;

  get isAdmin(): boolean {
    return this.auth.currentUser?.uid === this.game()?.adminId;
  }

  ngOnInit() {
    const gameId = this.route.snapshot.paramMap.get('id');
    if (gameId) {
      this.gameSub = runInInjectionContext(this.injector, () =>
        this.gameService.getGameById(gameId).subscribe((game) => {
          this.game.set(game);
          if (game.gameStatus === 'in_game') {
            this.router.navigate(['/play-quiz', game.id], {
              queryParams: { mode: 'multiplayer' },
            });
          }
        })
      );
    }
  }

  async startGame() {
    const g = this.game();
    if (g) {
      await this.gameService.startGame(g.id);
    }
  }

  goBack() {
    this.router.navigate(['/quizzes']);
  }

  ngOnDestroy() {
    this.gameSub?.unsubscribe();
  }
}
