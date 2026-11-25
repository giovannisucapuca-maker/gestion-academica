import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Rol } from '../../core/models/usuario.model';

// Directiva ESTRUCTURAL (lleva *): agrega o quita el elemento del HTML
// Uso:  <button *appHasRole="['admin']">Eliminar</button>
@Directive({
  selector: '[appHasRole]',
})
export class HasRole {
  private template = inject(TemplateRef);          // el elemento que tiene la directiva
  private contenedor = inject(ViewContainerRef);   // dónde se dibuja
  private auth = inject(AuthService);

  roles = input.required<Rol[]>({ alias: 'appHasRole' });

  private visible = false;

  constructor() {
    // effect = se vuelve a ejecutar solo cuando cambia el usuario (signal)
    effect(() => {
      const permitido = this.auth.tieneRol(this.roles());

      if (permitido && !this.visible) {
        this.contenedor.createEmbeddedView(this.template);   // lo dibuja
        this.visible = true;
      } else if (!permitido && this.visible) {
        this.contenedor.clear();                             // lo quita
        this.visible = false;
      }
    });
  }
}