import { Pipe, PipeTransform } from '@angular/core';

// Uso: {{ 'Ana Torres' | iniciales }}  →  AT
@Pipe({
  name: 'iniciales',
})
export class InicialesPipe implements PipeTransform {
  transform(nombre: string | null | undefined): string {
    if (!nombre) return '?';
    return nombre
      .trim()
      .split(/\s+/)                                 // ["Ana", "Torres"]
      .slice(0, 2)                                  // solo las 2 primeras palabras
      .map((palabra) => palabra[0].toUpperCase())   // ["A", "T"]
      .join('');                                    // "AT"
  }
}