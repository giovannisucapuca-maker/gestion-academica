import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatriculaService } from '../../../core/services/matricula.service';

@Component({
  selector: 'app-panel-estudiante',
  imports: [RouterLink],
  templateUrl: './panel-estudiante.html',
  styleUrl: './panel-estudiante.css',
})
export class PanelEstudiante {
  private matriculaService = inject(MatriculaService);

  // toSignal: convierte el Observable en signal (se suscribe y desuscribe solo)
  misCursos = toSignal(this.matriculaService.listar(), { initialValue: [] });
  creditos = computed(() => this.misCursos().reduce((suma, m) => suma + Number(m.creditos), 0));
}