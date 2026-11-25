import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Matricula } from '../models/matricula.model';
import { MensajeApi } from './base-crud.service';

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/matriculas.php`;

  // Lo que devuelve depende del rol (lo decide PHP con el token)
  listar(): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(this.url);
  }

  // GET matriculas.php?curso_id=N
  listarPorCurso(cursoId: number): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(this.url, { params: { curso_id: cursoId } });
  }

  matricular(cursoId: number): Observable<Matricula> {
    return this.http.post<Matricula>(this.url, { curso_id: cursoId });
  }

  anular(id: number): Observable<MensajeApi> {
    return this.http.delete<MensajeApi>(this.url, { params: { id } });
  }
}