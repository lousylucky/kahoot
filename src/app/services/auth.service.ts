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
  signInWithCredential,
  signInWithPopup,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { UserService } from './user.service';
import { Capacitor } from '@capacitor/core';
import { AlertController } from '@ionic/angular/standalone';

const RECENT_LOGIN_STORAGE_KEY = 'kahoot_recent_login_at';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private userService = inject(UserService);
  private alertCtrl = inject(AlertController);

  getConnectedUser(): Observable<User | null> {
    return user(this.auth);
  }

  currentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
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
    await this.userService.create(userCred.user.uid, alias);
    try {
      await sendEmailVerification(userCred.user);
    } catch (e) {
      console.warn('Verification email failed:', e);
    }
    await signOut(this.auth);
    this.clearRecentLogin();
  }

  async login(email: string, password: string): Promise<string | null> {
    try {
      const userCred = await signInWithEmailAndPassword(
        this.auth,
        email.trim(),
        password,
      );

      if (!userCred.user.emailVerified) {
        await signOut(this.auth);
        return 'Please verify your email before logging in. Check your inbox.';
      }

      this.markRecentLogin();
      await this.waitForCurrentUser();

      await this.router.navigateByUrl('/quizzes', { replaceUrl: true });
      return null;
    } catch (error: any) {
      this.clearRecentLogin();
      const code: string = error?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return 'Invalid email or password.';
      }
      if (code === 'auth/too-many-requests') {
        return 'Too many attempts. Please try again later.';
      }
      if (code === 'auth/user-disabled') {
        return 'This account has been disabled.';
      }
      return 'Login failed. Please try again.';
    }
  }

  async signInWithGoogle() {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        const idToken = result.credential?.idToken;

        if (!idToken) {
          throw new Error('Google sign-in succeeded but no ID token was returned.');
        }

        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(this.auth, credential);
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(this.auth, provider);
      }

      await this.ensureAlias();
      this.markRecentLogin();
      await this.router.navigateByUrl('/quizzes');
      return null;
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      const code: string = error?.code ?? '';

      if (code === 'auth/operation-not-allowed') {
        return 'Google sign-in is not enabled in Firebase Authentication.';
      }
      if (code === 'auth/unauthorized-domain') {
        return 'This web domain is not authorized in Firebase Authentication.';
      }
      if (code === 'auth/popup-blocked') {
        return 'The Google sign-in popup was blocked by the browser.';
      }
      if (code === 'auth/popup-closed-by-user') {
        return 'The Google sign-in popup was closed before completion.';
      }
      if (code === 'auth/cancelled-popup-request') {
        return 'Another Google sign-in popup request is already in progress.';
      }
      if (code === 'auth/account-exists-with-different-credential') {
        return 'An account already exists with the same email using a different sign-in method.';
      }

      return error?.message ?? 'Google sign-in failed.';
    }
  }

  async logout(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    }

    await signOut(this.auth);
    this.clearRecentLogin();
    this.router.navigateByUrl('/login');
  }

  sendResetPasswordLink(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  private async ensureAlias(): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;

    try {
      const userData = await firstValueFrom(this.userService.getById(uid));
      if (userData?.alias) return;
    } catch {
      // document doesn't exist yet
    }

    const alias = await this.promptForAlias();
    if (alias) {
      await this.userService.create(uid, alias);
    }
  }

  private promptForAlias(): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: 'Welcome!',
        subHeader: 'Choose your pseudo',
        message: 'Pick a display name that other players will see during games.',
        cssClass: 'alias-prompt',
        backdropDismiss: false,
        inputs: [
          {
            name: 'alias',
            type: 'text',
            placeholder: 'e.g. QuizMaster42',
            attributes: { maxlength: 14 },
          },
        ],
        buttons: [
          {
            text: 'Let\'s go!',
            cssClass: 'alias-confirm-btn',
            handler: (data) => {
              const value = data?.alias?.trim();
              if (!value) {
                return false;
              }
              resolve(value);
              return true;
            },
          },
        ],
      });
      await alert.present();
    });
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
