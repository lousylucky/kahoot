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
import { Observable } from 'rxjs';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { UserService } from './user.service';
import { Capacitor } from '@capacitor/core';

const RECENT_LOGIN_STORAGE_KEY = 'kahoot_recent_login_at';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private userService = inject(UserService);

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
    await this.userService.create({ alias, ...userCred.user });
    await sendEmailVerification(userCred.user);
    return this.logout();
  }

  async login(email: string, password: string): Promise<string | null> {
    try {
      await signInWithEmailAndPassword(
        this.auth,
        email.trim(),
        password,
      );

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

    this.markRecentLogin();
    this.router.navigateByUrl('/quizzes');
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
