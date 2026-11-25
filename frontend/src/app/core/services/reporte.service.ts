import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reporte } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);

  obtener(): Observable<Reporte> {
    return this.http.get<Reporte>(`${environment.apiUrl}/reportes.php`);
  }
}