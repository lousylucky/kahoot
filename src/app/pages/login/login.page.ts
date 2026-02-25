import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, RouterLink],
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';
  resetMessage = '';

  private auth = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  async onLogin() {
    try {
      await this.auth.signIn(this.email, this.password);
      this.router.navigateByUrl('/home');
    } catch (e: any) {
      this.errorMessage = e.message;
    }
  }

  async onResetPassword() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email first.';
      return;
    }
    try {
      await this.auth.resetPassword(this.email);
      this.resetMessage = 'Password reset email sent!';
      this.errorMessage = '';
    } catch (e: any) {
      if (e.code === 'auth/too-many-requests' || e.message?.includes('RESET_PASSWORD_EXCEED_LIMIT')) {
        this.errorMessage = 'Too many password reset attempts. Please try again later.';
      } else {
        this.errorMessage = e.code ?? e.message;
      }
      this.cdr.detectChanges();
    }
  }
}
