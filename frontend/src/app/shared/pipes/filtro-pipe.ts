import { Pipe, PipeTransform } from '@angular/core';

// Uso:  @for (c of cursos() | filtro: busqueda() : ['nombre', 'descripcion']; ...)
// Genérico <T>: sirve para cursos, usuarios o cualquier lista
@Pipe({
  name: 'filtro',
})
export class FiltroPipe implements PipeTransform {
  transform<T extends object>(lista: T[], texto: string, campos: (keyof T)[]): T[] {
    const termino = this.normalizar(texto);
    if (!termino) return lista;

    return lista.filter((item) =>
      campos.some((campo) => this.normalizar(String(item[campo] ?? '')).includes(termino))
    );
  }

  // "Programación" → "programacion": así buscar "programacion" también encuentra "Programación"
  private normalizar(valor: string): string {
    return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
}