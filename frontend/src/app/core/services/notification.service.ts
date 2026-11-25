import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Un "molde" de Swal para avisos pequeños en la esquina (toast)
  private toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
  });

  exito(texto: string): void {
    this.toast.fire({ icon: 'success', title: texto });
  }

  error(texto: string): void {
    this.toast.fire({ icon: 'error', title: texto });
  }

  info(texto: string): void {
    this.toast.fire({ icon: 'info', title: texto });
  }

  // Ventana central con botón OK (para avisos importantes, como "tu sesión expiró")
  alerta(titulo: string, texto: string): void {
    Swal.fire({ icon: 'warning', title: titulo, text: texto, confirmButtonColor: '#e90056' });
  }

  // Pregunta Sí/No. Devuelve true si el usuario confirmó (lo usaremos para ELIMINAR)
  async confirmar(titulo: string, texto = 'Esta acción no se puede deshacer'): Promise<boolean> {
    const resultado = await Swal.fire({
      icon: 'question',
      title: titulo,
      text: texto,
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e90056',
      cancelButtonColor: '#6b7280',
    });
    return resultado.isConfirmed;
  }
}