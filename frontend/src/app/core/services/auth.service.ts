import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JwtPayload, LoginRequest, LoginResponse } from '../models/auth.model';
import { Rol } from '../models/usuario.model';
import { TokenService } from './token.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private notificaciones = inject(NotificationService);
  private temporizador?: ReturnType<typeof setTimeout>;

  // signal = variable "reactiva": cuando cambia, la pantalla se actualiza sola
  readonly usuario = signal<JwtPayload | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);

  constructor() {
    // Si recargas la página (F5) y el token sigue vigente, recuperamos la sesión
    if (this.tokenService.estaVigente()) {
      this.usuario.set(this.tokenService.decodificar());
      this.programarCierre();
    } else {
      this.tokenService.eliminar();
    }
  }

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/login.php`, credenciales)
      .pipe(tap((respuesta) => this.actualizarSesion(respuesta.token)));
  }

  // Guarda un token (nuevo o renovado) y actualiza los datos del usuario en toda la app
  actualizarSesion(token: string): void {
    this.tokenService.guardar(token);
    this.usuario.set(this.tokenService.decodificar());
    this.programarCierre();
  }

  // motivo es opcional: si viene, se muestra una ventana de SweetAlert
  logout(motivo?: string): void {
    clearTimeout(this.temporizador);
    this.tokenService.eliminar();
    this.usuario.set(null);
    if (motivo) this.notificaciones.alerta('Sesión finalizada', motivo);
    this.router.navigate(['/login']);
  }

  estaAutenticado(): boolean {
    return this.tokenService.estaVigente();
  }

  tieneRol(roles: Rol[]): boolean {
    const rol = this.usuario()?.rol;
    return rol !== undefined && roles.includes(rol);
  }

  // "Despertador" que cierra la sesión en el momento exacto en que vence el token
  private programarCierre(): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(
      () => this.logout('Tu sesión expiró. Vuelve a iniciar sesión.'),
      this.tokenService.tiempoRestante()
    );
  }
}