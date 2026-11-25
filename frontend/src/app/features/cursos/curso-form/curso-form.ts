import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { CursoService } from '../../../core/services/curso.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-curso-form',
  imports: [ReactiveFormsModule, RouterLink, AsyncPipe],
  templateUrl: './curso-form.html',
  styleUrl: './curso-form.css',
})
export class CursoForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cursoService = inject(CursoService);
  private usuarioService = inject(UsuarioService);
  private auth = inject(AuthService);
  private notificaciones = inject(NotificationService);

  id = signal<number | null>(null);   // null = crear, número = editar
  esAdmin = this.auth.tieneRol(['admin']);
  // Solo el admin elige profesor (y solo él puede consultar usuarios.php)
  profesores$ = this.esAdmin ? this.usuarioService.listarPorRol('profesor') : null;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    creditos: [3, [Validators.required, Validators.min(1), Validators.max(6)]],
    cupos: [30, [Validators.required, Validators.min(1)]],
    profesor_id: [this.auth.usuario()?.sub ?? 0],
  });

  constructor() {
    // ¿La URL trae :id?  /cursos/3/editar → "3"   |   /cursos/nuevo → null
    const parametro = this.route.snapshot.paramMap.get('id');
    if (parametro) {
      this.id.set(Number(parametro));
      this.cursoService.obtener(Number(parametro)).subscribe((curso) => {
        this.form.patchValue({ ...curso, profesor_id: curso.profesor_id ?? 0 });   // rellena el form
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue();
    const id = this.id();
    const peticion = id
      ? this.cursoService.actualizar(id, datos)   // PUT
      : this.cursoService.crear(datos);           // POST

    peticion.subscribe(() => {
      this.notificaciones.exito(id ? 'Curso actualizado' : 'Curso creado');
      this.router.navigate(['/cursos']);
    });
  }
}