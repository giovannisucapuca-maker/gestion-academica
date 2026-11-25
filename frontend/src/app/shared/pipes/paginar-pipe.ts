import { Pipe, PipeTransform } from '@angular/core';

// Uso:  lista | paginar: 2 : 5   → elementos 6 al 10
@Pipe({
  name: 'paginar',
})
export class PaginarPipe implements PipeTransform {
  transform<T>(lista: T[], pagina: number, tamanio: number): T[] {
    const inicio = (pagina - 1) * tamanio;
    return lista.slice(inicio, inicio + tamanio);
  }
}