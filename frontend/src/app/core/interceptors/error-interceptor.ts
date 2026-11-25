import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificaciones = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Los errores del login los muestra el propio formulario
      if (req.url.includes('login.php')) {
        return throwError(() => error);
      }

      const mensajeApi: string | undefined = error.error?.mensaje;   // el "mensaje" de tu PHP

      switch (error.status) {
        case 0:   // PHP apagado
          notificaciones.error('No se pudo conectar con la API. ¿Está encendido PHP?');
          break;
        case 401: // token inválido o expirado
          authService.logout(
            mensajeApi === 'Token expirado'
              ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
              : 'Sesión no válida. Inicia sesión nuevamente.'
          );
          break;
        case 403: // sin permisos
          notificaciones.error(mensajeApi ?? 'No tienes permisos para esta acción');
          break;
        default:  // 400, 404, 409, 500...
          notificaciones.error(mensajeApi ?? `Error inesperado (${error.status})`);
      }

      return throwError(() => error);
    })
  );
};