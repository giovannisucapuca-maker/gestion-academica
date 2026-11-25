import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// VALIDADOR PERSONALIZADO: se aplica al GRUPO completo, porque compara 2 campos
// Si no coinciden, el grupo tiene el error { clavesDistintas: true }
export function clavesIguales(campo1: string, campo2: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor1 = grupo.get(campo1)?.value;
    const valor2 = grupo.get(campo2)?.value;
    return valor1 === valor2 ? null : { clavesDistintas: true };
  };
}