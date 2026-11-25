import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CursoService } from '../../../core/services/curso.service';

@Component({
  selector: 'app-panel-admin',
  imports: [RouterLink],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css',
})
export class PanelAdmin {
  private usuarioService = inject(UsuarioService);
  private cursoService = inject(CursoService);

  totalUsuarios = signal(0);
  activos = signal(0);
  totalCursos = signal(0);

  constructor() {
    // forkJoin: lanza las 2 peticiones A LA VEZ y espera a que terminen ambas
    forkJoin({
      usuarios: this.usuarioService.listar(),
      cursos: this.cursoService.listar(),
    }).subscribe(({ usuarios, cursos }) => {
      this.totalUsuarios.set(usuarios.length);
      this.activos.set(usuarios.filter((u) => u.activo).length);
      this.totalCursos.set(cursos.length);
    });
  }
}