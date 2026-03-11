import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton, IonHeader, IonContent, IonToolbar,
  IonInput, IonTitle, IonItem, IonIcon,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { logoGoogle, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';

addIcons({ logoGoogle, eyeOutline, eyeOffOutline });

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonButton, IonHeader, IonContent, IonToolbar,
    IonTitle, IonInput, IonItem, IonIcon,
    CommonModule, ReactiveFormsModule, RouterLink,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  showPassword = false;
  loginError = '';

  loginForm = this.fb.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', Validators.minLength(6)],
  });

  togglePassword() { this.showPassword = !this.showPassword; }

  async onSubmit() {
    this.loginError = '';
    const { email, password } = this.loginForm.value;
    const error = await this.authService.login(email!, password!);
    if (error) {
      this.loginError = error;
    }
  }

  loginWithGoogle() { this.authService.signInWithGoogle(); }
}
