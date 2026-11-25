import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Horario, NuevoHorario } from '../models/horario.model';
import { MensajeApi } from './base-crud.service';

@Injectable({ providedIn: 'root' })
export class HorarioService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/horarios.php`;

  // "Mi horario" (según el rol)
  listar(): Observable<Horario[]> {
    return this.http.get<Horario[]>(this.url);
  }

  listarPorCurso(cursoId: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(this.url, { params: { curso_id: cursoId } });
  }

  crear(horario: NuevoHorario): Observable<Horario> {
    return this.http.post<Horario>(this.url, horario);
  }

  eliminar(id: number): Observable<MensajeApi> {
    return this.http.delete<MensajeApi>(this.url, { params: { id } });
  }
}