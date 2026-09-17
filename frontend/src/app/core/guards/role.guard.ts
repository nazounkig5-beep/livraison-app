import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Usage dans les routes : { path: 'admin', canActivate: [roleGuard(['ADMIN'])], ... }
 */
export const roleGuard = (rolesAutorises: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.aLeRole(...rolesAutorises)) return true;

    router.navigate(['/']);
    return false;
  };
};
