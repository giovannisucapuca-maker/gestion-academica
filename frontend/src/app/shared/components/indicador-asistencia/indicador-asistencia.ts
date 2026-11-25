import { Component, computed, input } from '@angular/core';

// Uso: <app-indicador-asistencia [porcentaje]="85" />
// Menos de 70% = en riesgo (en Perú, con 30% de inasistencias se desaprueba)
@Component({
  selector: 'app-indicador-asistencia',
  imports: [],
  templateUrl: './indicador-asistencia.html',
  styleUrl: './indicador-asistencia.css',
})
export class IndicadorAsistencia {
  porcentaje = input<number | null>(null);

  nivel = computed(() => {
    const p = this.porcentaje();
    if (p === null) return 'sin-datos';
    if (p < 70) return 'riesgo';
    if (p < 85) return 'regular';
    return 'bien';
  });
}