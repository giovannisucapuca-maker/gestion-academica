import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PerfilService } from '../../core/services/perfil.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Usuario } from '../../core/models/usuario.model';
import { RolLabelPipe } from '../../shared/pipes/rol-label-pipe';
import { InicialesPipe } from '../../shared/pipes/iniciales-pipe';
import { clavesIguales } from '../../shared/validators/claves-iguales';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, DatePipe, RolLabelPipe, InicialesPipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  private fb = inject(FormBuilder);
  private perfilService = inject(PerfilService);
  private auth = inject(AuthService);
  private notificaciones = inject(NotificationService);

  usuario = signal<Usuario | null>(null);
  guardandoDatos = signal(false);
  guardandoClave = signal(false);

  formDatos = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  formClave = this.fb.nonNullable.group(
    {
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required],
    },
    { validators: clavesIguales('nueva', 'confirmar') }   // ← validador del GRUPO
  );

  constructor() {
    this.perfilService.obtener().subscribe((datos) => {
      this.usuario.set(datos);
      this.formDatos.patchValue(datos);
    });
  }

  guardarDatos(): void {
    if (this.formDatos.invalid) {
      this.formDatos.markAllAsTouched();
      return;
    }
    this.guardandoDatos.set(true);
    this.perfilService.actualizar(this.formDatos.getRawValue()).subscribe({
      next: (resp) => {
        this.usuario.set(resp.usuario);
        this.auth.actualizarSesion(resp.token);   // ← token nuevo: el menú se actualiza solo
        this.notificaciones.exito(resp.mensaje);
        this.guardandoDatos.set(false);
      },
      error: () => this.guardandoDatos.set(false),
    });
  }

  cambiarClave(): void {
    if (this.formClave.invalid) {
      this.formClave.markAllAsTouched();
      return;
    }
    this.guardandoClave.set(true);
    const { actual, nueva } = this.formClave.getRawValue();   // "confirmar" no se envía a PHP
    this.perfilService.cambiarClave({ actual, nueva }).subscribe({
      next: (resp) => {
        this.notificaciones.exito(resp.mensaje);
        this.formClave.reset();
        this.guardandoClave.set(false);
      },
      error: () => this.guardandoClave.set(false),   // el errorInterceptor muestra el mensaje de PHP
    });
  }
}