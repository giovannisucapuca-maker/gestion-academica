import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CursoService } from '../../../core/services/curso.service';
import { MatriculaService } from '../../../core/services/matricula.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Curso } from '../../../core/models/curso.model';
import { Matricula } from '../../../core/models/matricula.model';
import { Confirmar } from '../../../shared/directives/confirmar';
import { BarraCupos } from '../../../shared/components/barra-cupos/barra-cupos';

@Component({
  selector: 'app-mis-matriculas',
  imports: [DatePipe, RouterLink, Confirmar, BarraCupos],
  templateUrl: './mis-matriculas.html',
  styleUrl: './mis-matriculas.css',
})
export class MisMatriculas {
  private cursoService = inject(CursoService);
  private matriculaService = inject(MatriculaService);
  private notificaciones = inject(NotificationService);

  cursos = signal<Curso[]>([]);
  misMatriculas = signal<Matricula[]>([]);
  cargando = signal(true);

  // Set con los ids de los cursos en los que YA estoy matriculado
  private idsMatriculados = computed(() => new Set(this.misMatriculas().map((m) => Number(m.curso_id))));

  // Cursos disponibles = todos MENOS los que ya tengo
  disponibles = computed(() => this.cursos().filter((c) => !this.idsMatriculados().has(c.id)));

  totalCreditos = computed(() =>
    this.misMatriculas().reduce((suma, m) => suma + Number(m.creditos), 0)
  );

  constructor() {
    this.cargar();
  }

  // Pide cursos y matrículas A LA VEZ
  cargar(): void {
    forkJoin({
      cursos: this.cursoService.listar(),
      matriculas: this.matriculaService.listar(),
    }).subscribe({
      next: ({ cursos, matriculas }) => {
        this.cursos.set(cursos);
        this.misMatriculas.set(matriculas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  estaLleno(curso: Curso): boolean {
    return Number(curso.inscritos) >= Number(curso.cupos);
  }

  matricular(curso: Curso): void {
    this.matriculaService.matricular(curso.id).subscribe(() => {
      this.notificaciones.exito(`Te matriculaste en ${curso.nombre}`);
      this.cargar();   // recargamos para actualizar cupos y listas
    });
  }

  anular(matricula: Matricula): void {
    this.matriculaService.anular(matricula.id).subscribe((resp) => {
      this.notificaciones.exito(resp.mensaje);
      this.cargar();
    });
  }
}