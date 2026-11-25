import { Component, computed, inject, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import { ReporteService } from '../../core/services/reporte.service';
import { Reporte } from '../../core/models/reporte.model';
import { Grafico } from '../../shared/components/grafico/grafico';
import { IndicadorAsistencia } from '../../shared/components/indicador-asistencia/indicador-asistencia';

// Colores (paleta de referencia validada para daltonismo)
const AZUL = '#2a78d6';
const AZUL_SUAVE = 'rgba(42, 120, 214, 0.12)';
const ESTADO = { bien: '#0ca30c', aviso: '#fab219', critico: '#d03b3b' };

@Component({
  selector: 'app-reportes',
  imports: [Grafico, IndicadorAsistencia],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes {
  private reporteService = inject(ReporteService);

  datos = signal<Reporte | null>(null);
  generado = new Date();

  constructor() {
    this.reporteService.obtener().subscribe((reporte) => this.datos.set(reporte));
  }

  // ---------- 1. Ocupación de cursos (barras horizontales, %) ----------
  graficoOcupacion = computed<ChartConfiguration | null>(() => {
    const d = this.datos();
    if (!d) return null;
    return {
      type: 'bar',
      data: {
        labels: d.ocupacion.map((o) => o.curso),
        datasets: [
          {
            data: d.ocupacion.map((o) => o.porcentaje),
            backgroundColor: AZUL,
            borderRadius: 4,
            maxBarThickness: 18,
          },
        ],
      },
      options: {
        indexAxis: 'y',   // barras horizontales
        maintainAspectRatio: false,
        scales: {
          x: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } },
          y: { grid: { display: false } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const o = d.ocupacion[ctx.dataIndex];
                return ` ${o.inscritos} de ${o.cupos} cupos (${o.porcentaje}%)`;
              },
            },
          },
        },
      },
    };
  });

  // ---------- 2. Matrículas por día (línea, últimos 14 días) ----------
  graficoMatriculas = computed<ChartConfiguration | null>(() => {
    const d = this.datos();
    if (!d) return null;
    return {
      type: 'line',
      data: {
        labels: d.matriculas_por_dia.map((m) => formatDate(m.fecha + 'T00:00', 'dd/MM', 'es-PE')),
        datasets: [
          {
            data: d.matriculas_por_dia.map((m) => m.total),
            borderColor: AZUL,
            backgroundColor: AZUL_SUAVE,
            borderWidth: 2,
            fill: true,
            cubicInterpolationMode: 'monotone',   // curva suave que NO inventa subidas ni bajadas
            pointRadius: 4,
            pointBackgroundColor: AZUL,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },   // tooltip al pasar por la columna
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false } },
        },
        plugins: {
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} matrículas` } },
        },
      },
    };
  });

  // ---------- 3. Asistencia por estado (barras con colores de estado) ----------
  graficoEstados = computed<ChartConfiguration | null>(() => {
    const d = this.datos();
    if (!d) return null;
    const e = d.asistencia_estados;
    const total = e.presente + e.tarde + e.falta + e.justificada;
    const valores = [e.presente, e.tarde, e.falta, e.justificada];
    return {
      type: 'bar',
      data: {
        labels: ['Presente', 'Tarde', 'Falta', 'Justificada'],
        datasets: [
          {
            data: valores,
            backgroundColor: [ESTADO.bien, ESTADO.aviso, ESTADO.critico, AZUL],
            borderRadius: 4,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const valor = valores[ctx.dataIndex];
                const pct = total ? Math.round((valor * 100) / total) : 0;
                return ` ${valor} registros (${pct}%)`;
              },
            },
          },
        },
      },
    };
  });

  // ---------- 4. Asistencia promedio por curso (rojo si está debajo de 70%) ----------
  graficoAsistenciaCurso = computed<ChartConfiguration | null>(() => {
    const d = this.datos();
    if (!d) return null;
    return {
      type: 'bar',
      data: {
        labels: d.asistencia_por_curso.map((a) => a.curso),
        datasets: [
          {
            data: d.asistencia_por_curso.map((a) => a.porcentaje),
            backgroundColor: d.asistencia_por_curso.map((a) => (a.porcentaje < 70 ? ESTADO.critico : AZUL)),
            borderRadius: 4,
            maxBarThickness: 18,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        scales: {
          x: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } },
          y: { grid: { display: false } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const p = d.asistencia_por_curso[ctx.dataIndex].porcentaje;
                return ` ${p}% de asistencia${p < 70 ? ' · en riesgo' : ''}`;
              },
            },
          },
        },
      },
    };
  });

  imprimir(): void {
    window.print();   // el navegador permite "Guardar como PDF"
  }

  // Descarga la lista de estudiantes en riesgo como archivo CSV (se abre con Excel)
  exportarCsv(): void {
    const filas = this.datos()?.en_riesgo ?? [];
    const encabezado = 'Estudiante;Correo;Curso;Faltas;Asistencia %';
    const lineas = filas.map((f) => [f.estudiante, f.email, f.curso, f.faltas, f.porcentaje].join(';'));
    const contenido = '\uFEFF' + [encabezado, ...lineas].join('\n');   // \uFEFF: para que Excel lea bien las tildes

    const archivo = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `estudiantes-en-riesgo-${formatDate(new Date(), 'yyyy-MM-dd', 'es-PE')}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }
}