import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { formatDate } from '@angular/common';
import { forkJoin, interval } from 'rxjs';
import { CursoService } from '../../../core/services/curso.service';
import { AsistenciaService } from '../../../core/services/asistencia.service';
import { HorarioService } from '../../../core/services/horario.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Curso } from '../../../core/models/curso.model';
import {
  ESTADOS_ASISTENCIA,
  EstadoAsistencia,
  RegistroAsistencia,
  ResumenAsistencia,
  VentanaAsistencia,
} from '../../../core/models/asistencia.model';
import { InicialesPipe } from '../../../shared/pipes/iniciales-pipe';
import { DiaSemanaPipe } from '../../../shared/pipes/dia-semana-pipe';
import { IndicadorAsistencia } from '../../../shared/components/indicador-asistencia/indicador-asistencia';

@Component({
  selector: 'app-tomar-asistencia',
  imports: [FormsModule, InicialesPipe, DiaSemanaPipe, IndicadorAsistencia],
  templateUrl: './tomar-asistencia.html',
  styleUrl: './tomar-asistencia.css',
})
export class TomarAsistencia {
  private cursoService = inject(CursoService);
  private asistenciaService = inject(AsistenciaService);
  private horarioService = inject(HorarioService);
  private auth = inject(AuthService);
  private notificaciones = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  estados = ESTADOS_ASISTENCIA;
  hoy = formatDate(new Date(), 'yyyy-MM-dd', 'es-PE');   // "2026-11-24"

  cursos = signal<Curso[]>([]);
  cursoId = signal(0);
  fecha = signal(this.hoy);
  registros = signal<RegistroAsistencia[]>([]);
  resumen = signal<ResumenAsistencia[]>([]);
  diasDeClase = signal<number[]>([]);
  ventana = signal<VentanaAsistencia | null>(null);
  guardando = signal(false);

  // ¿Se puede marcar en este momento? (lo decide PHP)
  abierta = computed(() => this.ventana()?.abierta ?? false);

  // Cuántos estudiantes hay en cada estado (para los contadores de arriba)
  conteo = computed(() => {
    const c: Record<string, number> = { presente: 0, tarde: 0, falta: 0, justificada: 0, pendiente: 0 };
    this.registros().forEach((r) => c[r.estado ?? 'pendiente']++);
    return c;
  });

  constructor() {
    const usuario = this.auth.usuario();
    this.cursoService.listar().subscribe((cursos) => {
      // El profesor solo ve sus cursos; el admin, todos
      const visibles =
        usuario?.rol === 'profesor' ? cursos.filter((c) => Number(c.profesor_id) === usuario.sub) : cursos;
      this.cursos.set(visibles);
      if (visibles.length) {
        this.cambiarCurso(visibles[0].id);
      }
    });

    // Cada 30 segundos vuelve a preguntar si la asistencia ya se abrió (o se cerró)
    // takeUntilDestroyed: deja de preguntar cuando sales de la página
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.revisarVentana());
  }

  cambiarCurso(id: number): void {
    this.cursoId.set(Number(id));
    this.horarioService.listarPorCurso(this.cursoId()).subscribe((sesiones) => {
      this.diasDeClase.set([...new Set(sesiones.map((s) => Number(s.dia)))]);
    });
    this.cargar();
  }

  cambiarFecha(fecha: string): void {
    this.fecha.set(fecha);
    this.cargar();
  }

  // Pide la lista, el resumen y la ventana de horario A LA VEZ
  cargar(): void {
    if (!this.cursoId() || !this.fecha()) return;
    forkJoin({
      lista: this.asistenciaService.lista(this.cursoId(), this.fecha()),
      resumen: this.asistenciaService.resumenCurso(this.cursoId()),
      ventana: this.asistenciaService.ventana(this.cursoId(), this.fecha()),
    }).subscribe(({ lista, resumen, ventana }) => {
      this.registros.set(lista);
      this.resumen.set(resumen);
      this.ventana.set(ventana);
    });
  }

  private revisarVentana(): void {
    if (!this.cursoId() || !this.fecha()) return;
    this.asistenciaService
      .ventana(this.cursoId(), this.fecha())
      .subscribe((ventana) => this.ventana.set(ventana));
  }

  marcar(estudianteId: number, estado: EstadoAsistencia): void {
    if (!this.abierta()) return;
    this.registros.update((lista) =>
      lista.map((r) => (r.estudiante_id === estudianteId ? { ...r, estado } : r))
    );
  }

  marcarTodos(estado: EstadoAsistencia): void {
    if (!this.abierta()) return;
    this.registros.update((lista) => lista.map((r) => ({ ...r, estado })));
  }

  guardar(): void {
    if (this.conteo()['pendiente'] > 0) {
      this.notificaciones.error(`Faltan ${this.conteo()['pendiente']} estudiantes por marcar`);
      return;
    }
    this.guardando.set(true);
    this.asistenciaService
      .guardar({
        curso_id: this.cursoId(),
        fecha: this.fecha(),
        registros: this.registros().map((r) => ({ estudiante_id: r.estudiante_id, estado: r.estado! })),
      })
      .subscribe({
        next: (resp) => {
          this.notificaciones.exito(resp.mensaje);
          this.guardando.set(false);
          this.cargar();
        },
        error: () => {
          // Si PHP respondió 403 (ventana cerrada), el errorInterceptor ya mostró el mensaje
          this.guardando.set(false);
          this.revisarVentana();
        },
      });
  }
}