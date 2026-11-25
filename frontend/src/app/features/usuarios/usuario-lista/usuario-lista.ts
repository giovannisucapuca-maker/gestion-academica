import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Usuario } from '../../../core/models/usuario.model';
import { FiltroPipe } from '../../../shared/pipes/filtro-pipe';
import { RolLabelPipe } from '../../../shared/pipes/rol-label-pipe';
import { InicialesPipe } from '../../../shared/pipes/iniciales-pipe';
import { OrdenarPipe } from '../../../shared/pipes/ordenar-pipe';
import { PaginarPipe } from '../../../shared/pipes/paginar-pipe';
import { Confirmar } from '../../../shared/directives/confirmar';
import { Orden, Ordenar } from '../../../shared/directives/ordenar';
import { Paginador } from '../../../shared/components/paginador/paginador';

@Component({
  selector: 'app-usuario-lista',
  imports: [
    FormsModule,
    RouterLink,
    FiltroPipe,
    RolLabelPipe,
    InicialesPipe,
    OrdenarPipe,
    PaginarPipe,
    Confirmar,
    Ordenar,
    Paginador,
  ],
  templateUrl: './usuario-lista.html',
  styleUrl: './usuario-lista.css',
})
export class UsuarioLista {
  private usuarioService = inject(UsuarioService);
  private notificaciones = inject(NotificationService);

  usuarios = signal<Usuario[]>([]);

  // Estado de la tabla
  busqueda = signal('');
  orden = signal<Orden>({ campo: 'nombre', direccion: 'asc' });
  pagina = signal(1);
  tamanio = signal(5);

  constructor() {
    this.usuarioService.listar().subscribe((datos) => this.usuarios.set(datos));
  }

  eliminar(usuario: Usuario): void {
    this.usuarioService.eliminar(usuario.id).subscribe((resp) => {
      this.usuarios.update((lista) => lista.filter((u) => u.id !== usuario.id));
      this.notificaciones.exito(resp.mensaje);
    });
  }
}