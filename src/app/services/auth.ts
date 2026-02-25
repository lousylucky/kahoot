import { Injectable } from '@angular/core';
import { Auth as FirebaseAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  isLoggedIn$: Observable<boolean>;

  constructor(private firebaseAuth: FirebaseAuth) {
    this.isLoggedIn$ = user(this.firebaseAuth).pipe(map((u) => !!u));
  }

  createUser(email: string, password: string) {
    return createUserWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  signIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  signOut() {
    return signOut(this.firebaseAuth);
  }

  sendVerificationEmail() {
    const currentUser = this.firebaseAuth.currentUser;
    if (!currentUser) throw new Error('No user logged in');
    return sendEmailVerification(currentUser);
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(this.firebaseAuth, email);
  }
}
