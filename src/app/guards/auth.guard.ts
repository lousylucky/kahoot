import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.isLoggedIn$.pipe(
    take(1),
    map((loggedIn) => {
      if (loggedIn) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};
