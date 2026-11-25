import { Rol, Usuario } from './usuario.model';

// Lo que Angular ENVÍA a login.php
export interface LoginRequest {
  email: string;
  password: string;
}

// Lo que login.php RESPONDE
export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

// Lo que hay DENTRO del token (lo que viste en jwt.io)
export interface JwtPayload {
  sub: number;
  nombre: string;
  email: string;
  rol: Rol;
  iat: number;
  exp: number;
}