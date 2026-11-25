import { Pipe, PipeTransform } from '@angular/core';
import { Rol } from '../../core/models/usuario.model';

// Uso:  {{ 'admin' | rolLabel }}        → Administrador
//       {{ 'admin' | rolLabel: true }}  → 🛡️ Administrador
@Pipe({
  name: 'rolLabel',
})
export class RolLabelPipe implements PipeTransform {
  private readonly etiquetas: Record<Rol, { texto: string; icono: string }> = {
    admin: { texto: 'Administrador', icono: '🛡️' },
    profesor: { texto: 'Profesor', icono: '👨‍🏫' },
    estudiante: { texto: 'Estudiante', icono: '🎒' },
  };

  transform(rol: Rol | null | undefined, conIcono = false): string {
    if (!rol) return '';
    const etiqueta = this.etiquetas[rol];
    if (!etiqueta) return rol;
    return conIcono ? `${etiqueta.icono} ${etiqueta.texto}` : etiqueta.texto;
  }
}