import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { MisMatriculas } from './mis-matriculas/mis-matriculas';
import { MatriculaLista } from './matricula-lista/matricula-lista';

@Component({
  selector: 'app-matriculas',
  imports: [MisMatriculas, MatriculaLista],
  templateUrl: './matriculas.html',
  styleUrl: './matriculas.css',
})
export class Matriculas {
  protected auth = inject(AuthService);
}