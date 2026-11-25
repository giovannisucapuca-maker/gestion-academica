import { Component, computed, effect, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Uso:  <app-paginador [total]="120" [(pagina)]="pagina" [(tamanio)]="tamanio" />
@Component({
  selector: 'app-paginador',
  imports: [FormsModule],
  templateUrl: './paginador.html',
  styleUrl: './paginador.css',
})
export class Paginador {
  total = input.required<number>();   // cuántos elementos hay en total
  pagina = model(1);                  // [(pagina)]  doble enlace con el padre
  tamanio = model(5);                 // [(tamanio)] filas por página

  opcionesTamanio = [5, 10, 20];

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamanio())));
  desde = computed(() => (this.total() === 0 ? 0 : (this.pagina() - 1) * this.tamanio() + 1));
  hasta = computed(() => Math.min(this.pagina() * this.tamanio(), this.total()));
  paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));   // [1, 2, 3...]

  constructor() {
    // Si eliminas el último elemento de la última página, retrocede una página
    effect(() => {
      if (this.pagina() > this.totalPaginas()) {
        this.pagina.set(this.totalPaginas());
      }
    });
  }

  irA(numero: number): void {
    if (numero >= 1 && numero <= this.totalPaginas()) {
      this.pagina.set(numero);
    }
  }

  cambiarTamanio(nuevo: number): void {
    this.tamanio.set(Number(nuevo));
    this.pagina.set(1);
  }
}