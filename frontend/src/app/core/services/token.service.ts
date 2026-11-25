import { Injectable } from '@angular/core';
import { JwtPayload } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly CLAVE = 'token';

  // sessionStorage: se borra al cerrar el navegador (más seguro que localStorage)
  guardar(token: string): void {
    sessionStorage.setItem(this.CLAVE, token);
  }

  obtener(): string | null {
    return sessionStorage.getItem(this.CLAVE);
  }

  eliminar(): void {
    sessionStorage.removeItem(this.CLAVE);
  }

  // Lee el PAYLOAD (la parte del medio), igual que hacía jwt.io
  decodificar(): JwtPayload | null {
    const token = this.obtener();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));   // TextDecoder respeta tildes: "Lucía"
    } catch {
      return null;   // token corrupto
    }
  }

  // Milisegundos que le quedan al token (0 si ya venció)
  tiempoRestante(): number {
    const payload = this.decodificar();
    if (!payload) return 0;
    return Math.max(payload.exp * 1000 - Date.now(), 0);   // exp viene en segundos
  }

  estaVigente(): boolean {
    return this.tiempoRestante() > 0;
  }
}