import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { HorarioService } from '../../../core/services/horario.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Horario } from '../../../core/models/horario.model';
import { DIAS_SEMANA, DiaSemanaPipe } from '../../../shared/pipes/dia-semana-pipe';
import { Confirmar } from '../../../shared/directives/confirmar';

// Uso: <app-curso-horario [cursoId]="5" [puedeGestionar]="true" />
@Component({
  selector: 'app-curso-horario',
  imports: [ReactiveFormsModule, SlicePipe, DiaSemanaPipe, Confirmar],
  templateUrl: './curso-horario.html',
  styleUrl: './curso-horario.css',
})
export class CursoHorario {
  private fb = inject(FormBuilder);
  private horarioService = inject(HorarioService);
  private notificaciones = inject(NotificationService);

  cursoId = input.required<number>();
  puedeGestionar = input(false);   // ¿mostrar el formulario y los botones de borrar?

  sesiones = signal<Horario[]>([]);
  dias = DIAS_SEMANA;

  form = this.fb.nonNullable.group({
    dia: [1, Validators.required],
    hora_inicio: ['08:00', Validators.required],
    hora_fin: ['10:00', Validators.required],
    aula: ['', Validators.required],
  });

  constructor() {
    // effect: cada vez que cambie el input cursoId, recarga las sesiones
    effect(() => this.cargar(this.cursoId()));
  }

  private cargar(cursoId: number): void {
    this.horarioService.listarPorCurso(cursoId).subscribe((datos) => this.sesiones.set(datos));
  }

  agregar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = { ...this.form.getRawValue(), curso_id: this.cursoId() };
    // Si el aula está ocupada, PHP responde 409 y el errorInterceptor muestra el mensaje
    this.horarioService.crear(datos).subscribe(() => {
      this.notificaciones.exito('Sesión agregada al horario');
      this.form.patchValue({ aula: '' });
      this.cargar(this.cursoId());
    });
  }

  eliminar(sesion: Horario): void {
    this.horarioService.eliminar(sesion.id).subscribe((resp) => {
      this.notificaciones.exito(resp.mensaje);
      this.cargar(this.cursoId());
    });
  }
}