import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
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
  IonIcon,
} from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { GameService } from '../../services/game.service';
import { addIcons } from 'ionicons';
import { scanOutline, closeOutline } from 'ionicons/icons';
import jsQR from 'jsqr';

addIcons({ scanOutline, closeOutline });

@Component({
  selector: 'app-join-game',
  templateUrl: 'join-game.page.html',
  styleUrls: ['join-game.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, IonIcon, FormsModule],
})
export class JoinGamePage {
  private gameService = inject(GameService);
  private auth = inject(Auth);
  private router = inject(Router);

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;

  entryCode = '';
  error = '';
  scanning = signal(false);
  private stream: MediaStream | null = null;
  private animFrameId = 0;

  async scanQR() {
    this.error = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      this.scanning.set(true);

      // Wait for DOM to render video element
      setTimeout(() => {
        const video = this.videoRef.nativeElement;
        video.srcObject = this.stream;
        video.play();
        this.detectQR();
      }, 100);
    } catch {
      this.error = 'Camera permission is required to scan QR codes.';
    }
  }

  stopScan() {
    cancelAnimationFrame(this.animFrameId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.scanning.set(false);
  }

  private detectQR() {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    const tick = () => {
      if (!this.scanning()) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(imageData.data, canvas.width, canvas.height);

        if (qr) {
          const code = qr.data.trim();
          if (/^\d{1,6}$/.test(code)) {
            this.stopScan();
            this.entryCode = code;
            this.joinGame();
            return;
          }
        }
      }
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

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

  ngOnDestroy() {
    this.stopScan();
  }
}
