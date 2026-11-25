export interface Horario {
  id: number;
  curso_id: number;
  curso: string;
  dia: number;            // 1 = lunes ... 6 = sábado
  hora_inicio: string;    // "08:00:00"
  hora_fin: string;
  aula: string;
  profesor_id: number | null;
  profesor: string | null;
}

// Lo que se envía al crear una sesión
export interface NuevoHorario {
  curso_id: number;
  dia: number;
  hora_inicio: string;
  hora_fin: string;
  aula: string;
}