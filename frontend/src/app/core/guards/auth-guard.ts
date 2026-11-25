import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// AuthGuard: solo deja pasar si hay un token vigente
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) {
    return true;   // ✅ pasa
  }

  // Había sesión pero el token venció
  if (auth.usuario()) {
    auth.logout('Tu sesión expiró. Vuelve a iniciar sesión.');
  }

  // ❌ Al login, recordando a dónde quería ir (returnUrl)
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};