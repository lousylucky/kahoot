import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton, IonButtons, IonContent, IonInput, IonItem, IonIcon, IonToolbar, IonHeader, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';

addIcons({ mailOutline, arrowBackOutline, checkmarkCircleOutline });

@Component({
  selector: 'app-password-retrieve',
  templateUrl: './password-retrieve.page.html',
  styleUrls: ['./password-retrieve.page.scss'],
  imports: [IonTitle, IonHeader, IonToolbar, IonButtons,
    IonButton, IonContent, IonInput, IonItem, IonIcon,
    CommonModule, ReactiveFormsModule, RouterLink,
  ],
})
export class PasswordRetrievePage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  submitted = signal(false);

  passwordRetrieveForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get f() { return this.passwordRetrieveForm.controls; }

  onSubmit() {
    if (this.passwordRetrieveForm.invalid) return;
    this.authService.sendResetPasswordLink(this.passwordRetrieveForm.value.email!);
    this.submitted.set(true);
  }
}
