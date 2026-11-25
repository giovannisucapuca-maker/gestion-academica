export type EstadoAsistencia = 'presente' | 'tarde' | 'falta' | 'justificada';

// Etiqueta, ícono y clase CSS de cada estado (se usa en botones, badges y leyendas)
export const ESTADOS_ASISTENCIA: { valor: EstadoAsistencia; texto: string; letra: string; icono: string }[] = [
  { valor: 'presente', texto: 'Presente', letra: 'P', icono: 'bi-check-circle-fill' },
  { valor: 'tarde', texto: 'Tarde', letra: 'T', icono: 'bi-clock-fill' },
  { valor: 'falta', texto: 'Falta', letra: 'F', icono: 'bi-x-circle-fill' },
  { valor: 'justificada', texto: 'Justificada', letra: 'J', icono: 'bi-file-earmark-medical-fill' },
];

// Una fila de la lista para tomar asistencia
export interface RegistroAsistencia {
  estudiante_id: number;
  estudiante: string;
  estudiante_email: string;
  estado: EstadoAsistencia | null;   // null = todavía no se marcó
}

// Conteos y porcentaje (por estudiante o por curso)
export interface ResumenAsistencia {
  estudiante_id?: number;
  estudiante?: string;
  curso_id?: number;
  curso?: string;
  total: number;
  presentes: number;
  tardes: number;
  faltas: number;
  justificadas: number;
  porcentaje: number | null;
}

export interface DetalleAsistencia {
  fecha: string;
  estado: EstadoAsistencia;
}

export interface GuardarAsistencia {
  curso_id: number;
  fecha: string;
  registros: { estudiante_id: number; estado: EstadoAsistencia }[];
}

// ¿Está abierta la toma de asistencia? (lo decide PHP con la hora del servidor)
export interface VentanaAsistencia {
  abierta: boolean;
  mensaje: string;
}