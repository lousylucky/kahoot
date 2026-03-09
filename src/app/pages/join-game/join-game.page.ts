import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-join-game',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Join Game</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Join Game</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-item>
        <ion-input
          label="Entry Code"
          labelPlacement="floating"
          [(ngModel)]="entryCode"
          placeholder="Enter 6-digit code"
          type="text"
          maxlength="6"
        ></ion-input>
      </ion-item>

      <ion-button expand="block" class="ion-margin-top" (click)="joinGame()" [disabled]="!entryCode.trim()">
        Join
      </ion-button>

      @if (error) {
        <p class="ion-text-center" style="color: var(--ion-color-danger); margin-top: 16px;">{{ error }}</p>
      }
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, FormsModule],
})
export class JoinGamePage {
  private gameService = inject(GameService);
  private auth = inject(Auth);
  private router = inject(Router);

  entryCode = '';
  error = '';

  async joinGame() {
    this.error = '';
    const game = await this.gameService.findGameByEntryCode(this.entryCode.trim());
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
