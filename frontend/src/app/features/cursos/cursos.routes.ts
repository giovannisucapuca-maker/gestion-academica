import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role-guard';
import { CursoLista } from './curso-lista/curso-lista';
import { CursoForm } from './curso-form/curso-form';
import { CursoDetalle } from './curso-detalle/curso-detalle';

export const CURSOS_ROUTES: Routes = [
  { path: '', component: CursoLista, title: 'Cursos' },
  {
    path: 'nuevo',
    component: CursoForm,
    canActivate: [roleGuard],
    data: { roles: ['admin', 'profesor'] },
    title: 'Nuevo curso',
  },
  // :id es un PARÁMETRO: /cursos/1, /cursos/2...
  { path: ':id', component: CursoDetalle, title: 'Detalle del curso' },
  {
    path: ':id/editar',
    component: CursoForm,   // el MISMO formulario sirve para crear y editar
    canActivate: [roleGuard],
    data: { roles: ['admin', 'profesor'] },
    title: 'Editar curso',
  },
];