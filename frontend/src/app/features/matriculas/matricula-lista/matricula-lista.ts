import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatriculaService } from '../../../core/services/matricula.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Matricula } from '../../../core/models/matricula.model';
import { FiltroPipe } from '../../../shared/pipes/filtro-pipe';
import { OrdenarPipe } from '../../../shared/pipes/ordenar-pipe';
import { PaginarPipe } from '../../../shared/pipes/paginar-pipe';
import { InicialesPipe } from '../../../shared/pipes/iniciales-pipe';
import { HasRole } from '../../../shared/directives/has-role';
import { Confirmar } from '../../../shared/directives/confirmar';
import { Orden, Ordenar } from '../../../shared/directives/ordenar';
import { Paginador } from '../../../shared/components/paginador/paginador';

@Component({
  selector: 'app-matricula-lista',
  imports: [
    DatePipe,
    FormsModule,
    FiltroPipe,
    OrdenarPipe,
    PaginarPipe,
    InicialesPipe,
    HasRole,
    Confirmar,
    Ordenar,
    Paginador,
  ],
  templateUrl: './matricula-lista.html',
  styleUrl: './matricula-lista.css',
})
export class MatriculaLista {
  private matriculaService = inject(MatriculaService);
  private notificaciones = inject(NotificationService);

  matriculas = signal<Matricula[]>([]);

  busqueda = signal('');
  orden = signal<Orden>({ campo: 'fecha', direccion: 'desc' });   // las más recientes primero
  pagina = signal(1);
  tamanio = signal(10);

  constructor() {
    this.matriculaService.listar().subscribe((datos) => this.matriculas.set(datos));
  }

  anular(matricula: Matricula): void {
    this.matriculaService.anular(matricula.id).subscribe((resp) => {
      this.matriculas.update((lista) => lista.filter((m) => m.id !== matricula.id));
      this.notificaciones.exito(resp.mensaje);
    });
  }
}