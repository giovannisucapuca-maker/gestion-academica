// Un "tipo unión": el rol SOLO puede ser uno de estos 3 textos
export type Rol = 'admin' | 'profesor' | 'estudiante';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: number;        // MySQL devuelve 1 o 0
  creado_en?: string;    // el ? significa "opcional"
  password?: string;     // solo se envía al crear/editar
}