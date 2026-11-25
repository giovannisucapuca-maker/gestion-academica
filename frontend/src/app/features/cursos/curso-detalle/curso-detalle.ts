import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable, of, shareReplay, switchMap } from 'rxjs';
import { CursoService } from '../../../core/services/curso.service';
import { MatriculaService } from '../../../core/services/matricula.service';
import { AuthService } from '../../../core/services/auth.service';
import { Curso } from '../../../core/models/curso.model';
import { Matricula } from '../../../core/models/matricula.model';
import { HasRole } from '../../../shared/directives/has-role';
import { InicialesPipe } from '../../../shared/pipes/iniciales-pipe';
import { BarraCupos } from '../../../shared/components/barra-cupos/barra-cupos';
import { CursoHorario } from '../curso-horario/curso-horario';

@Component({
  selector: 'app-curso-detalle',
  imports: [RouterLink, AsyncPipe, DatePipe, HasRole, InicialesPipe, BarraCupos, CursoHorario],
  templateUrl: './curso-detalle.html',
  styleUrl: './curso-detalle.css',
})
export class CursoDetalle {
  private route = inject(ActivatedRoute);
  private cursoService = inject(CursoService);
  private matriculaService = inject(MatriculaService);
  private auth = inject(AuthService);

  // shareReplay(1): curso$ se usa 2 veces (en el HTML y en alumnos$), pero la petición se hace UNA vez
  curso$: Observable<Curso> = this.route.paramMap.pipe(
    switchMap((params) => this.cursoService.obtener(Number(params.get('id')))),
    shareReplay(1)
  );

  // Encadenamos Observables: primero el curso → luego (si corresponde) sus alumnos
  alumnos$: Observable<Matricula[] | null> = this.curso$.pipe(
    switchMap((curso) => (this.puedeGestionar(curso) ? this.matriculaService.listarPorCurso(curso.id) : of(null)))
  );

  // Admin: siempre · Profesor: solo si es SU curso · Estudiante: nunca
  // Se usa para ver la lista de alumnos y para gestionar el horario
  puedeGestionar(curso: Curso): boolean {
    const usuario = this.auth.usuario();
    if (usuario?.rol === 'admin') return true;
    return usuario?.rol === 'profesor' && Number(curso.profesor_id) === usuario.sub;
  }
}