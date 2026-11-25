import { Pipe, PipeTransform } from '@angular/core';

// Exportamos la lista para reutilizarla en otros componentes (selects, calendario)
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Uso: {{ 1 | diaSemana }} → Lunes    {{ 1 | diaSemana: true }} → Lun
@Pipe({
  name: 'diaSemana',
})
export class DiaSemanaPipe implements PipeTransform {
  transform(dia: number | string, corto = false): string {
    const nombre = DIAS_SEMANA[Number(dia) - 1] ?? '—';
    return corto ? nombre.slice(0, 3) : nombre;
  }
}