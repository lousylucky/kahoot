import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonHeader,
  IonContent,
  IonToolbar,
  IonInput,
  IonTitle,
  IonItem,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { logoGoogle, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';

addIcons({ logoGoogle, eyeOutline, eyeOffOutline });

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <ion-header [translucent]="true">
          <ion-toolbar>
            <ion-title>Login</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content [fullscreen]="true">
          <ion-header collapse="condense">
            <ion-toolbar>
              <ion-title size="large">Login</ion-title>
            </ion-toolbar>
          </ion-header>
          <ion-grid>
            <ion-row>
              <ion-col>
                <ion-list>
                  <ion-item class="ion-margin-bottom">
                    <ion-input
                      formControlName="email"
                      fill="solid"
                      label="Email"
                      labelPlacement="floating"
                      placeholder="user@gmail.com"
                      type="email"
                    ></ion-input>
                  </ion-item>
                  <ion-item class="ion-margin-bottom">
                    <ion-input
                      [type]="showPassword ? 'text' : 'password'"
                      formControlName="password"
                      fill="solid"
                      label="Password"
                      labelPlacement="floating"
                    >
                      <ion-button slot="end" fill="clear" (click)="togglePassword()" type="button">
                        <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                      </ion-button>
                    </ion-input>
                  </ion-item>
                  <p class="ion-text-center">
                    Forgot your password ?
                    <a routerLink="/password-retrieve">Retrieve it here</a>
                  </p>
                </ion-list>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <ion-button
                  class="ion-margin-bottom ion-margin-top"
                  expand="block"
                  type="submit"
                  >Login</ion-button
                >
              </ion-col>
            </ion-row>
            <!-- <ion-row>
              <ion-col>
                <ion-button
                  (click)="loginWithGoogle()"
                  expand="block"
                  fill="outline"
                  type="button"
                  >Login with Google
                  <ion-icon
                    [style.margin-left.rem]="0.25"
                    name="logo-google"
                  ></ion-icon
                ></ion-button>
              </ion-col>
            </ion-row> -->
            <ion-row>
              <ion-col>
                <p class="ion-text-center">
                  No account yet ?
                  <a routerLink="/register">Register here</a>
                </p>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-content>
      </form>
  `,
  imports: [
    IonButton,
    IonHeader,
    IonContent,
    IonToolbar,
    IonTitle,
    IonInput,
    IonList,
    IonItem,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  loginForm = this.fb.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', Validators.minLength(6)],
  });

  onSubmit() {
    const { email, password } = this.loginForm.value;
    this.authService.login(email!, password!);
  }

  loginWithGoogle() {
    this.authService.signInWithGoogle();
  }
}
