import { inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    filter((u) => u !== undefined),
    take(1),
    map((u) => {
      if (u) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};
