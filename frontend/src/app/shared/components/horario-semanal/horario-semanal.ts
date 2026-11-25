import { Component, computed, input } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { Horario } from '../../../core/models/horario.model';
import { DIAS_SEMANA } from '../../pipes/dia-semana-pipe';

const HORA_INICIO = 7;    // el calendario empieza a las 7:00
const HORA_FIN = 22;      // y termina a las 22:00
const COLORES = ['#e90056', '#7c3aed', '#2563eb', '#059669', '#ea580c', '#0891b2', '#db2777', '#4f46e5'];

// Un bloque = una clase + su posición en la grilla
interface Bloque {
  horario: Horario;
  columna: number;
  filaInicio: number;
  filaFin: number;
  color: string;
}

// Uso: <app-horario-semanal [horarios]="listaDeHorarios" />
@Component({
  selector: 'app-horario-semanal',
  imports: [SlicePipe],
  templateUrl: './horario-semanal.html',
  styleUrl: './horario-semanal.css',
})
export class HorarioSemanal {
  horarios = input.required<Horario[]>();

  dias = DIAS_SEMANA;
  horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i);   // [7, 8, ... 21]

  bloques = computed<Bloque[]>(() =>
    this.horarios().map((h) => ({
      horario: h,
      columna: Number(h.dia) + 1,                          // columna 1 = horas; lunes = 2
      filaInicio: this.fila(h.hora_inicio),
      filaFin: this.fila(h.hora_fin),
      color: COLORES[Number(h.curso_id) % COLORES.length], // mismo curso = mismo color
    }))
  );

  // "08:30:00" → número de fila (fila 1 = cabecera; cada fila = 30 minutos)
  private fila(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    const minutos = (h - HORA_INICIO) * 60 + m;
    return Math.round(minutos / 30) + 2;
  }
}