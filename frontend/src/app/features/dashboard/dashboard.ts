import { Component, Type, computed, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Rol } from '../../core/models/usuario.model';
import { RolLabelPipe } from '../../shared/pipes/rol-label-pipe';
import { PanelAdmin } from './panel-admin/panel-admin';
import { PanelProfesor } from './panel-profesor/panel-profesor';
import { PanelEstudiante } from './panel-estudiante/panel-estudiante';

@Component({
  selector: 'app-dashboard',
  imports: [NgComponentOutlet, RolLabelPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected auth = inject(AuthService);

  // Un "mapa": a cada rol le corresponde un COMPONENTE distinto
  private readonly paneles: Record<Rol, Type<unknown>> = {
    admin: PanelAdmin,
    profesor: PanelProfesor,
    estudiante: PanelEstudiante,
  };

  // Se decide EN TIEMPO DE EJECUCIÓN qué componente dibujar
  panel = computed(() => {
    const rol = this.auth.usuario()?.rol;
    return rol ? this.paneles[rol] : null;
  });
}