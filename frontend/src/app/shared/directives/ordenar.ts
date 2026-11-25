import { Directive, computed, input, model } from '@angular/core';

// Estado del orden de una tabla: qué columna y en qué dirección
export interface Orden {
  campo: string;
  direccion: 'asc' | 'desc';
}

// Uso:  <th appOrdenar="nombre" [(orden)]="orden">Curso</th>
@Directive({
  selector: 'th[appOrdenar]',   // solo se puede usar en <th>
  host: {
    class: 'ordenable',                                              // siempre tiene esta clase
    '[class.ordenado]': 'activo()',                                  // clase si es la columna activa
    '[attr.data-direccion]': 'activo() ? orden().direccion : null',  // para dibujar ↑ o ↓ con CSS
    '(click)': 'alternar()',
  },
})
export class Ordenar {
  campo = input.required<string>({ alias: 'appOrdenar' });
  // model = input + output: permite el "doble enlace" [(orden)] con el componente padre
  orden = model.required<Orden>();

  activo = computed(() => this.orden().campo === this.campo());

  // 1er clic → ascendente;  2do clic en la misma columna → descendente
  alternar(): void {
    const direccion = this.activo() && this.orden().direccion === 'asc' ? 'desc' : 'asc';
    this.orden.set({ campo: this.campo(), direccion });
  }
}