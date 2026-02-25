import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, RouterLink],
})
export class RegisterPage {
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';

  private auth = inject(Auth);
  private router = inject(Router);

  async onRegister() {
    try {
      await this.auth.createUser(this.email, this.password);
      await this.auth.sendVerificationEmail();
      this.successMessage = 'Account created! A verification email has been sent.';
      setTimeout(() => this.router.navigateByUrl('/home'), 2000);
    } catch (e: any) {
      this.errorMessage = e.message;
    }
  }
}
