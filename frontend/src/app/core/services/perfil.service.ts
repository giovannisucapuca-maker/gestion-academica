import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.model';
import { MensajeApi } from './base-crud.service';

// Lo que responde PHP al actualizar datos: mensaje + usuario + token NUEVO
export interface ActualizarPerfilResponse extends MensajeApi {
  usuario: Usuario;
  token: string;
}

export interface CambioClave {
  actual: string;
  nueva: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/perfil.php`;

  obtener(): Observable<Usuario> {
    return this.http.get<Usuario>(this.url);
  }

  actualizar(datos: { nombre: string; email: string }): Observable<ActualizarPerfilResponse> {
    return this.http.put<ActualizarPerfilResponse>(this.url, datos);
  }

  // PUT perfil.php?accion=clave
  cambiarClave(datos: CambioClave): Observable<MensajeApi> {
    return this.http.put<MensajeApi>(this.url, datos, { params: { accion: 'clave' } });
  }
}