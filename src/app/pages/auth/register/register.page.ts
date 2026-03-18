import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, logoGoogle, checkmarkCircleOutline } from 'ionicons/icons';
import {
  IonButton, IonContent, IonInput, IonItem, IonIcon, IonToolbar, IonHeader, IonTitle, IonBackButton, IonButtons, IonSpinner } from '@ionic/angular/standalone';

addIcons({ eyeOutline, eyeOffOutline, logoGoogle, checkmarkCircleOutline });

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
  imports: [IonButtons, IonBackButton, IonTitle, IonHeader, IonToolbar,
    IonButton, IonContent, IonInput, IonItem, IonIcon, IonSpinner,
    CommonModule, ReactiveFormsModule, RouterLink,
  ],
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  showPassword = false;
  showConfirm  = false;
  loading = signal(false);
  success = signal(false);
  errorMsg = signal('');

  registerForm = this.fb.group({
    email:           ['', [Validators.email, Validators.required]],
    alias:           ['', [Validators.required]],
    password:        ['', [Validators.required, Validators.minLength(6), strongPasswordValidator()]],
    passwordConfirm: ['', passwordConfirmMatchPasswordValidator()],
  });

  get f() { return this.registerForm.controls; }

  get strengthClass(): string {
    const v: string = this.f['password'].value ?? '';
    const score = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(v)).length;
    if (score <= 2) return 'weak';
    if (score === 3) return 'medium';
    return 'strong';
  }

  get strengthLabel(): string {
    return { weak: 'Weak', medium: 'Fair', strong: 'Strong' }[this.strengthClass] ?? 'Weak';
  }

  async onSubmit() {
    if (this.registerForm.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set('');

    try {
      const { email, password, alias } = this.registerForm.value;
      await this.authService.register(email!, password!, alias!);
      this.success.set(true);
    } catch (error: any) {
      const code: string = error?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        this.errorMsg.set('This email is already registered.');
      } else if (code === 'auth/invalid-email') {
        this.errorMsg.set('Invalid email address.');
      } else if (code === 'auth/weak-password') {
        this.errorMsg.set('Password is too weak.');
      } else {
        console.error('Registration error:', code, error);
        this.errorMsg.set(`Registration failed (${code || 'unknown'}). Please try again.`);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async registerWithGoogle() {
    const error = await this.authService.signInWithGoogle();
    if (error) {
      this.errorMsg.set(error);
    }
  }
}

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v: string = control.value ?? '';
    const valid = /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v);
    return valid ? null : { weakPassword: true };
  };
}

export function passwordConfirmMatchPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const controls = control.parent?.controls as { [key: string]: AbstractControl | null };
    const password = controls?.['password']?.value;
    return control.value === password ? null : { passwordConfirmMissmatch: true };
  };
}
