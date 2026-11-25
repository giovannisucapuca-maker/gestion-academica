import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseCrudService } from './base-crud.service';
import { Rol, Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends BaseCrudService<Usuario> {
  protected recurso = 'usuarios.php';

  // Un método EXTRA propio de usuarios (lo usaremos para elegir profesor en un curso)
  listarPorRol(rol: Rol): Observable<Usuario[]> {
    return this.listar().pipe(map((usuarios) => usuarios.filter((u) => u.rol === rol)));
  }
}