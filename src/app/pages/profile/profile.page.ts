import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, logOutOutline } from 'ionicons/icons';
import { filter, take } from 'rxjs/operators';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonTitle,
    IonToolbar,
  ],
})
export class ProfilePage implements OnInit {
  alias = signal<string>('');
  editableAlias = signal<string>('');
  email = signal<string>('');
  aliasError = signal<string>('');
  isSavingAlias = signal(false);

  avatarLetter = computed(() => {
    const source = this.editableAlias().trim() || this.alias().trim() || this.email().trim() || 'G';
    return source.charAt(0).toUpperCase();
  });

  canSaveAlias = computed(() => {
    const nextAlias = this.editableAlias().trim();
    return !!nextAlias && nextAlias.length <= 14 && nextAlias !== this.alias().trim() && !this.isSavingAlias();
  });

  private userService = inject(UserService);
  private auth = inject(Auth);
  private router = inject(Router);

  constructor() {
    addIcons({ chevronBackOutline, logOutOutline });
  }

  ngOnInit() {
    user(this.auth)
      .pipe(
        filter((u): u is NonNullable<typeof u> => !!u),
        take(1),
      )
      .subscribe({
        next: (u) => {
          this.email.set(u.email ?? '');

          this.userService.getById(u.uid).pipe(take(1)).subscribe({
            next: (userData) => {
              if (userData?.alias) {
                this.alias.set(userData.alias);
                this.editableAlias.set(userData.alias);
              }
            },
          });
        },
      });
  }

  onAliasInput(event: Event) {
    const input = event.target as HTMLIonInputElement;
    const rawValue = `${input.value ?? ''}`;
    const trimmedValue = rawValue.slice(0, 14);

    if (rawValue !== trimmedValue) {
      input.value = trimmedValue;
    }

    this.aliasError.set('');
    this.editableAlias.set(trimmedValue);
  }

  async saveAlias() {
    const uid = this.auth.currentUser?.uid;
    const nextAlias = this.editableAlias().trim();

    if (!uid) return;

    if (!nextAlias) {
      this.aliasError.set('Alias is required.');
      return;
    }

    if (nextAlias === this.alias().trim()) {
      return;
    }

    this.isSavingAlias.set(true);
    this.aliasError.set('');

    try {
      await this.userService.updateAlias(uid, nextAlias);
      this.alias.set(nextAlias);
      this.editableAlias.set(nextAlias);
    } catch (error) {
      console.error('Alias update failed', error);
      this.aliasError.set('Unable to update your alias right now.');
    } finally {
      this.isSavingAlias.set(false);
    }
  }

  async onLogout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }

  goBack() {
    this.router.navigateByUrl('/quizzes');
  }
}
