import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CursoService } from '../../../core/services/curso.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Curso } from '../../../core/models/curso.model';
import { FiltroPipe } from '../../../shared/pipes/filtro-pipe';
import { OrdenarPipe } from '../../../shared/pipes/ordenar-pipe';
import { PaginarPipe } from '../../../shared/pipes/paginar-pipe';
import { HasRole } from '../../../shared/directives/has-role';
import { Confirmar } from '../../../shared/directives/confirmar';
import { Orden, Ordenar } from '../../../shared/directives/ordenar';
import { Paginador } from '../../../shared/components/paginador/paginador';
import { BarraCupos } from '../../../shared/components/barra-cupos/barra-cupos';

@Component({
  selector: 'app-curso-lista',
  imports: [
    FormsModule,
    RouterLink,
    FiltroPipe,
    OrdenarPipe,
    PaginarPipe,
    HasRole,
    Confirmar,
    Ordenar,
    Paginador,
    BarraCupos,
  ],
  templateUrl: './curso-lista.html',
  styleUrl: './curso-lista.css',
})
export class CursoLista {
  private cursoService = inject(CursoService);
  private notificaciones = inject(NotificationService);

  cursos = signal<Curso[]>([]);
  cargando = signal(true);

  // Estado de la tabla
  busqueda = signal('');
  orden = signal<Orden>({ campo: 'nombre', direccion: 'asc' });
  pagina = signal(1);
  tamanio = signal(5);

  constructor() {
    this.cursoService.listar().subscribe({
      next: (datos) => {
        this.cursos.set(datos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  eliminar(curso: Curso): void {
    this.cursoService.eliminar(curso.id).subscribe((resp) => {
      this.cursos.update((lista) => lista.filter((c) => c.id !== curso.id));
      this.notificaciones.exito(resp.mensaje);
    });
  }
}