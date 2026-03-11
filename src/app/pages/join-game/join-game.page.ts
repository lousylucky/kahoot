import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-join-game',
  templateUrl: 'join-game.page.html',
  styleUrls: ['join-game.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, FormsModule],
})
export class JoinGamePage {
  private gameService = inject(GameService);
  private auth = inject(Auth);
  private router = inject(Router);

  entryCode = '';
  error = '';

  async joinGame() {
    this.error = '';
    const game = await this.gameService.findGameByEntryCode(
      this.entryCode.trim(),
    );
    if (!game) {
      this.error = 'Game not found or already started.';
      return;
    }
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    await this.gameService.joinGame(game.id, uid);
    this.router.navigate(['/game-lobby', game.id]);
  }
}
