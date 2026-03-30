import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';

const RECENT_LOGIN_STORAGE_KEY = 'kahoot_recent_login_at';
const RECENT_LOGIN_MAX_AGE_MS = 15_000;

export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  try {
    await Promise.race([
      auth.authStateReady(),
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch (error) {
    console.error('Auth guard initialization failed', error);
  }

  if (auth.currentUser) {
    clearRecentLoginMarker();
    return true;
  }

  if (hasRecentLoginMarker()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

function hasRecentLoginMarker(): boolean {
  const rawValue = globalThis.sessionStorage?.getItem(RECENT_LOGIN_STORAGE_KEY);
  const timestamp = Number(rawValue);

  if (!Number.isFinite(timestamp)) {
    clearRecentLoginMarker();
    return false;
  }

  const isFresh = Date.now() - timestamp < RECENT_LOGIN_MAX_AGE_MS;

  if (!isFresh) {
    clearRecentLoginMarker();
  }

  return isFresh;
}

function clearRecentLoginMarker(): void {
  globalThis.sessionStorage?.removeItem(RECENT_LOGIN_STORAGE_KEY);
}
