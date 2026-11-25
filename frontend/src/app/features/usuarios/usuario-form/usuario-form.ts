import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Rol } from '../../../core/models/usuario.model';
import { RolLabelPipe } from '../../../shared/pipes/rol-label-pipe';

@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule, RouterLink, RolLabelPipe],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css',
})
export class UsuarioForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private notificaciones = inject(NotificationService);

  id = signal<number | null>(null);
  roles: Rol[] = ['admin', 'profesor', 'estudiante'];

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    rol: ['estudiante' as Rol, Validators.required],
    activo: [true],
  });

  constructor() {
    const parametro = this.route.snapshot.paramMap.get('id');
    if (parametro) {
      // EDITAR: rellenamos el form (la contraseña queda vacía = no se cambia)
      this.id.set(Number(parametro));
      this.usuarioService.obtener(Number(parametro)).subscribe((u) => {
        this.form.patchValue({ ...u, activo: !!u.activo });   // 1/0 → true/false
      });
    } else {
      // CREAR: la contraseña es obligatoria
      this.form.controls.password.addValidators([Validators.required, Validators.minLength(6)]);
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { activo, ...resto } = this.form.getRawValue();
    const datos = { ...resto, activo: activo ? 1 : 0 };   // true/false → 1/0 para MySQL
    const id = this.id();
    const peticion = id
      ? this.usuarioService.actualizar(id, datos)
      : this.usuarioService.crear(datos);

    peticion.subscribe(() => {
      this.notificaciones.exito(id ? 'Usuario actualizado' : 'Usuario creado');
      this.router.navigate(['/usuarios']);
    });
  }
}