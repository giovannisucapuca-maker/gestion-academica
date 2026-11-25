import { Directive, inject, input, output } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

// Directiva de ATRIBUTO: agrega comportamiento a un elemento existente
// Uso:  <button [appConfirmar]="'¿Eliminar?'" (confirmado)="eliminar(c)">Eliminar</button>
@Directive({
  selector: '[appConfirmar]',
  host: { '(click)': 'alHacerClic()' },   // escucha el clic del botón
})
export class Confirmar {
  private notificaciones = inject(NotificationService);

  mensaje = input('¿Estás seguro?', { alias: 'appConfirmar' });
  confirmado = output<void>();   // evento propio que emite solo si el usuario dijo "Sí"

  async alHacerClic(): Promise<void> {
    const ok = await this.notificaciones.confirmar(this.mensaje());   // SweetAlert
    if (ok) {
      this.confirmado.emit();
    }
  }
}