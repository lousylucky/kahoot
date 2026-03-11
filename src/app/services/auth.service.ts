import { inject, Injectable } from '@angular/core';
import {
  Auth,
  User,
  user,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { UserService } from './user.service';
import { ToastController } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';

const RECENT_LOGIN_STORAGE_KEY = 'kahoot_recent_login_at';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private userService = inject(UserService);
  private toastController = inject(ToastController);

  getConnectedUser(): Observable<User | null> {
    return user(this.auth);
  }

  async register(
    email: string,
    password: string,
    alias: string,
  ): Promise<void> {
    const userCred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );
    await this.userService.create({ alias, ...userCred.user });
    await sendEmailVerification(userCred.user);
    return this.logout();
  }

  async login(email: string, password: string): Promise<void> {
    let toast: HTMLIonToastElement | undefined;
    try {
      await signInWithEmailAndPassword(
        this.auth,
        email.trim(),
        password,
      );

      this.markRecentLogin();
      await this.waitForCurrentUser();

      const navigated = await this.router.navigateByUrl('/quizzes', {
        replaceUrl: true,
      });

      if (!navigated) {
        throw new Error('Navigation to /quizzes was rejected.');
      }

      toast = await this.toastController.create({
        message: `Login successful`,
        duration: 1500,
      });
    } catch (error) {
      this.clearRecentLogin();
      console.error(error);
      toast = await this.toastController.create({
        message: `Something wrong happened during login`,
        duration: 1500,
      });
    } finally {
      await toast?.present();
    }
  }

  async signInWithGoogle() {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signInWithGoogle();
    } else {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    }

    this.markRecentLogin();
    this.router.navigateByUrl('/quizzes');
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.clearRecentLogin();
    this.router.navigateByUrl('/login');
  }

  sendResetPasswordLink(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  private waitForCurrentUser(timeoutMs = 5000): Promise<User | null> {
    if (this.auth.currentUser) {
      return Promise.resolve(this.auth.currentUser);
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(this.auth.currentUser);
      }, timeoutMs);

      const unsubscribe = onAuthStateChanged(
        this.auth,
        (currentUser) => {
          if (!currentUser) {
            return;
          }

          clearTimeout(timeoutId);
          unsubscribe();
          resolve(currentUser);
        },
        () => {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(this.auth.currentUser);
        },
      );
    });
  }

  private markRecentLogin(): void {
    globalThis.sessionStorage?.setItem(
      RECENT_LOGIN_STORAGE_KEY,
      String(Date.now()),
    );
  }

  private clearRecentLogin(): void {
    globalThis.sessionStorage?.removeItem(RECENT_LOGIN_STORAGE_KEY);
  }
}
