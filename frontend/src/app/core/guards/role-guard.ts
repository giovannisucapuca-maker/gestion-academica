import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Rol } from '../models/usuario.model';

// Lógica compartida: ¿el rol del usuario está en la lista permitida?
function verificarRol(roles: Rol[] | undefined) {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notificaciones = inject(NotificationService);

  if (!roles || auth.tieneRol(roles)) {
    return true;
  }

  notificaciones.error('No tienes permisos para entrar a esa sección');
  return router.createUrlTree(['/acceso-denegado']);
}

// Para rutas normales (lo usaremos en "nuevo" y "editar" en el Paso 9)
export const roleGuard: CanActivateFn = (route) => verificarRol(route.data['roles']);

// Para rutas lazy: si no tienes el rol, el módulo NI SE DESCARGA
export const roleMatchGuard: CanMatchFn = (route) => verificarRol(route.data?.['roles']);