import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { TomarAsistencia } from './tomar-asistencia/tomar-asistencia';
import { MiAsistencia } from './mi-asistencia/mi-asistencia';

@Component({
  selector: 'app-asistencia',
  imports: [TomarAsistencia, MiAsistencia],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css',
})
export class Asistencia {
  protected auth = inject(AuthService);
}