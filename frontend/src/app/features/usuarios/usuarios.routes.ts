import { Routes } from '@angular/router';
import { UsuarioLista } from './usuario-lista/usuario-lista';
import { UsuarioForm } from './usuario-form/usuario-form';

// Todo este archivo ya está protegido por roleMatchGuard (solo admin) en app.routes.ts
export const USUARIOS_ROUTES: Routes = [
  { path: '', component: UsuarioLista, title: 'Usuarios' },
  { path: 'nuevo', component: UsuarioForm, title: 'Nuevo usuario' },
  { path: ':id/editar', component: UsuarioForm, title: 'Editar usuario' },
];