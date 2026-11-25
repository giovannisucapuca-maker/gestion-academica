import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { Curso } from '../models/curso.model';

@Injectable({ providedIn: 'root' })
export class CursoService extends BaseCrudService<Curso> {
  protected recurso = 'cursos.php';
}