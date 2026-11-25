import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { HorarioService } from '../../core/services/horario.service';
import { AuthService } from '../../core/services/auth.service';
import { Horario } from '../../core/models/horario.model';
import { HorarioSemanal } from '../../shared/components/horario-semanal/horario-semanal';
import { DiaSemanaPipe } from '../../shared/pipes/dia-semana-pipe';

@Component({
  selector: 'app-horario',
  imports: [FormsModule, SlicePipe, DecimalPipe, HorarioSemanal, DiaSemanaPipe],
  templateUrl: './horario.html',
  styleUrl: './horario.css',
})
export class HorarioPagina {
  private horarioService = inject(HorarioService);
  protected auth = inject(AuthService);

  horarios = signal<Horario[]>([]);
  cursoFiltro = signal(0);   // 0 = todos

  // Cursos distintos que aparecen en el horario (para el filtro del admin)
  cursos = computed(() => {
    const mapa = new Map<number, string>();
    this.horarios().forEach((h) => mapa.set(Number(h.curso_id), h.curso));
    return [...mapa].map(([id, nombre]) => ({ id, nombre }));
  });

  visibles = computed(() =>
    this.cursoFiltro() ? this.horarios().filter((h) => Number(h.curso_id) === this.cursoFiltro()) : this.horarios()
  );

  horasSemanales = computed(() =>
    this.visibles().reduce((total, h) => total + this.duracion(h), 0)
  );

  constructor() {
    this.horarioService.listar().subscribe((datos) => this.horarios.set(datos));
  }

  // Duración de una sesión en horas: "08:00" a "10:00" → 2
  private duracion(h: Horario): number {
    const minutos = (hora: string) => {
      const [hh, mm] = hora.split(':').map(Number);
      return hh * 60 + mm;
    };
    return (minutos(h.hora_fin) - minutos(h.hora_inicio)) / 60;
  }
}