import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { loginGuard } from './core/guards/login-guard';
import { roleMatchGuard } from './core/guards/role-guard';
import { Layout } from './core/layout/layout';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Iniciar sesión',
  },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'cursos',
        loadChildren: () =>
          import('./features/cursos/cursos.routes').then((m) => m.CURSOS_ROUTES),
      },
      {
        path: 'matriculas',
        loadChildren: () =>
          import('./features/matriculas/matriculas.routes').then((m) => m.MATRICULAS_ROUTES),
      },
      {
        path: 'horario',
        loadComponent: () => import('./features/horario/horario').then((m) => m.HorarioPagina),
        title: 'Horario de clases',
      },
      {
        path: 'asistencia',
        loadComponent: () => import('./features/asistencia/asistencia').then((m) => m.Asistencia),
        title: 'Asistencia',
      },
      {
        path: 'usuarios',
        canMatch: [roleMatchGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'reportes',
        canMatch: [roleMatchGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/reportes/reportes').then((m) => m.Reportes),
        title: 'Reportes',
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
        title: 'Mi perfil',
      },
      {
        path: 'acceso-denegado',
        loadComponent: () =>
          import('./shared/components/acceso-denegado/acceso-denegado').then((m) => m.AccesoDenegado),
        title: 'Acceso denegado',
      },
      { path: 'inicio', redirectTo: 'dashboard' },
    ],
  },

  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found').then((m) => m.NotFound),
    title: 'Página no encontrada',
  },
];