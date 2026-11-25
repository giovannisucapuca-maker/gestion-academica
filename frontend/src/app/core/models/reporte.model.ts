export interface Reporte {
  totales: {
    estudiantes: number;
    profesores: number;
    cursos: number;
    matriculas: number;
    asistencia_promedio: number | null;
  };
  ocupacion: { curso: string; inscritos: number; cupos: number; porcentaje: number }[];
  matriculas_por_dia: { fecha: string; total: number }[];
  asistencia_estados: { presente: number; tarde: number; falta: number; justificada: number };
  asistencia_por_curso: { curso: string; porcentaje: number }[];
  en_riesgo: { estudiante: string; email: string; curso: string; faltas: number; porcentaje: number }[];
}