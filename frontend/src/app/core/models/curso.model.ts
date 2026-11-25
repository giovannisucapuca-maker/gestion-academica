export interface Curso {
  id: number;
  nombre: string;
  descripcion: string;
  creditos: number;
  cupos: number;
  profesor_id: number | null;
  profesor?: string | null;   // nombre del profesor (viene del LEFT JOIN)
  inscritos?: number;         // cantidad de matriculados (viene del COUNT)
}