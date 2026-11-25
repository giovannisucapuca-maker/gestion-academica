import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';
import { CursoService } from '../../../core/services/curso.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-panel-profesor',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './panel-profesor.html',
  styleUrl: './panel-profesor.css',
})
export class PanelProfesor {
  private cursoService = inject(CursoService);
  private auth = inject(AuthService);

  // Solo los cursos cuyo profesor_id es el id del usuario logueado (sub del token)
  misCursos$ = this.cursoService
    .listar()
    .pipe(map((cursos) => cursos.filter((c) => Number(c.profesor_id) === this.auth.usuario()?.sub)));
}