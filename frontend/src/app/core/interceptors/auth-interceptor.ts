import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  // 1) El login no lleva token (todavía no lo tenemos)
  if (req.url.includes('login.php')) {
    return next(req);
  }

  // 2) Sin token: la petición sale tal cual
  const token = tokenService.obtener();
  if (!token) {
    return next(req);
  }

  // 3) Token vencido: NI SIQUIERA molestamos al servidor
  if (!tokenService.estaVigente()) {
    authService.logout('Tu sesión expiró. Vuelve a iniciar sesión.');
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Token expirado' }));
  }

  // 4) Las peticiones no se pueden modificar: se CLONAN con la cabecera nueva
  const reqConToken = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(reqConToken);
};
