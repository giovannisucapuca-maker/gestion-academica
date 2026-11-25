import { Pipe, PipeTransform } from '@angular/core';
import { Orden } from '../directives/ordenar';

// Uso:  lista | ordenar: { campo: 'nombre', direccion: 'asc' }
@Pipe({
  name: 'ordenar',
})
export class OrdenarPipe implements PipeTransform {
  transform<T extends object>(lista: T[], orden: Orden): T[] {
    const factor = orden.direccion === 'asc' ? 1 : -1;
    const campo = orden.campo as keyof T;

    // [...lista] crea una COPIA: sort() modifica el arreglo, y no queremos tocar el original
    return [...lista].sort((a, b) => {
      const valorA = a[campo];
      const valorB = b[campo];

      if (typeof valorA === 'number' && typeof valorB === 'number') {
        return (valorA - valorB) * factor;
      }
      // localeCompare 'es' ordena bien tildes y ñ; numeric: "Curso 2" antes que "Curso 10"
      return String(valorA ?? '').localeCompare(String(valorB ?? ''), 'es', { numeric: true }) * factor;
    });
  }
}