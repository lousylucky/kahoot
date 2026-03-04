import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-join-game',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Join Game</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Join Game</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container"></div>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule],
})
export class JoinGamePage {}
