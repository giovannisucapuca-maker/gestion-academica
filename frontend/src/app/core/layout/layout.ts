import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { HasRole } from '../../shared/directives/has-role';
import { RolLabelPipe } from '../../shared/pipes/rol-label-pipe';
import { InicialesPipe } from '../../shared/pipes/iniciales-pipe';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, HasRole, RolLabelPipe, InicialesPipe],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  protected auth = inject(AuthService);
  private router = inject(Router);

  hoy = new Date();
  menuAbierto = signal(false);   // para celulares

  // Cada vez que termina una navegación, leemos el "title" de la ruta
  // toSignal convierte el Observable de eventos del router en un signal
  titulo = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.tituloActual())
    ),
    { initialValue: this.tituloActual() }
  );

  // Busca la ruta hija más profunda y devuelve su "title" (definido en los archivos de rutas)
  private tituloActual(): string {
    let ruta = this.router.routerState.snapshot.root;
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }
    return ruta.title ?? '';
  }

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }
}