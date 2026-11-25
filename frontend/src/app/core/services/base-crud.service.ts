import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MensajeApi {
  mensaje: string;
}

// <T> es un "genérico": T será Curso o Usuario según quién herede
export abstract class BaseCrudService<T extends { id: number }> {
  protected http = inject(HttpClient);

  // "abstract" = cada clase hija ESTÁ OBLIGADA a decir su archivo PHP
  protected abstract recurso: string;

  protected get url(): string {
    return `${environment.apiUrl}/${this.recurso}`;
  }

  // GET cursos.php
  listar(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  // GET cursos.php?id=2      (params arma el "?id=2" por nosotros)
  obtener(id: number): Observable<T> {
    return this.http.get<T>(this.url, { params: { id } });
  }

  // POST cursos.php   + datos en JSON
  crear(datos: Partial<T>): Observable<T> {
    return this.http.post<T>(this.url, datos);
  }

  // PUT cursos.php?id=2   + datos en JSON
  actualizar(id: number, datos: Partial<T>): Observable<T> {
    return this.http.put<T>(this.url, datos, { params: { id } });
  }

  // DELETE cursos.php?id=2
  eliminar(id: number): Observable<MensajeApi> {
    return this.http.delete<MensajeApi>(this.url, { params: { id } });
  }
}