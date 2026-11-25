import { Component, computed, input } from '@angular/core';

// Uso: <app-barra-cupos [inscritos]="18" [cupos]="30" />
@Component({
  selector: 'app-barra-cupos',
  imports: [],
  templateUrl: './barra-cupos.html',
  styleUrl: './barra-cupos.css',
})
export class BarraCupos {
  inscritos = input.required<number>();
  cupos = input.required<number>();

  porcentaje = computed(() =>
    this.cupos() > 0 ? Math.min(100, Math.round((Number(this.inscritos()) / Number(this.cupos())) * 100)) : 0
  );

  // verde: normal · naranja: 75% o más · rojo: lleno
  nivel = computed(() => {
    const p = this.porcentaje();
    if (p >= 100) return 'lleno';
    if (p >= 75) return 'alto';
    return 'normal';
  });
}