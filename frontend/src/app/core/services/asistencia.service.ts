import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DetalleAsistencia,
  GuardarAsistencia,
  RegistroAsistencia,
  ResumenAsistencia,
  VentanaAsistencia,
} from '../models/asistencia.model';
import { MensajeApi } from './base-crud.service';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/asistencias.php`;

  // ---- PROFESOR / ADMIN ----
  lista(cursoId: number, fecha: string): Observable<RegistroAsistencia[]> {
    return this.http.get<RegistroAsistencia[]>(this.url, { params: { curso_id: cursoId, fecha } });
  }

  resumenCurso(cursoId: number): Observable<ResumenAsistencia[]> {
    return this.http.get<ResumenAsistencia[]>(this.url, { params: { curso_id: cursoId, resumen: 1 } });
  }

  // GET asistencias.php?curso_id=1&fecha=2026-11-24&ventana=1
  ventana(cursoId: number, fecha: string): Observable<VentanaAsistencia> {
    return this.http.get<VentanaAsistencia>(this.url, { params: { curso_id: cursoId, fecha, ventana: 1 } });
  }

  guardar(datos: GuardarAsistencia): Observable<MensajeApi> {
    return this.http.post<MensajeApi>(this.url, datos);
  }

  // ---- ESTUDIANTE ----
  miResumen(): Observable<ResumenAsistencia[]> {
    return this.http.get<ResumenAsistencia[]>(this.url);
  }

  miDetalle(cursoId: number): Observable<DetalleAsistencia[]> {
    return this.http.get<DetalleAsistencia[]>(this.url, { params: { curso_id: cursoId } });
  }
}