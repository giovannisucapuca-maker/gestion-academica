import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AsistenciaService } from '../../../core/services/asistencia.service';
import {
  DetalleAsistencia,
  ESTADOS_ASISTENCIA,
  ResumenAsistencia,
} from '../../../core/models/asistencia.model';
import { IndicadorAsistencia } from '../../../shared/components/indicador-asistencia/indicador-asistencia';

@Component({
  selector: 'app-mi-asistencia',
  imports: [DatePipe, IndicadorAsistencia],
  templateUrl: './mi-asistencia.html',
  styleUrl: './mi-asistencia.css',
})
export class MiAsistencia {
  private asistenciaService = inject(AsistenciaService);

  resumen = signal<ResumenAsistencia[]>([]);
  cursoAbierto = signal<number | null>(null);
  detalle = signal<DetalleAsistencia[]>([]);

  constructor() {
    this.asistenciaService.miResumen().subscribe((datos) => this.resumen.set(datos));
  }

  // Abre/cierra el detalle de un curso (acordeón)
  alternar(cursoId: number): void {
    if (this.cursoAbierto() === cursoId) {
      this.cursoAbierto.set(null);
      return;
    }
    this.cursoAbierto.set(cursoId);
    this.asistenciaService.miDetalle(cursoId).subscribe((datos) => this.detalle.set(datos));
  }

  info(estado: string) {
    return ESTADOS_ASISTENCIA.find((e) => e.valor === estado);
  }
}