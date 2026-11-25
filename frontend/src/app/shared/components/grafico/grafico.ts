import { Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registramos todos los tipos de gráfico de Chart.js (barras, líneas, etc.) UNA vez
Chart.register(...registerables);

// Estilo base para todos los gráficos de la app: ejes y grilla discretos, letra de la app
Chart.defaults.font.family = "'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif";
Chart.defaults.color = '#6b7280';
Chart.defaults.borderColor = '#eef0f3';
Chart.defaults.plugins.legend.display = false;   // 1 sola serie: el título ya la nombra
Chart.defaults.plugins.tooltip.backgroundColor = '#0f172a';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;

// Uso: <app-grafico [config]="miConfiguracion" [alto]="300" />
@Component({
  selector: 'app-grafico',
  imports: [],
  templateUrl: './grafico.html',
  styleUrl: './grafico.css',
})
export class Grafico implements OnDestroy {
  config = input.required<ChartConfiguration>();
  alto = input(280);

  // viewChild: referencia al <canvas #lienzo> del HTML
  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico?: Chart;

  constructor() {
    // Cada vez que cambia la configuración, se vuelve a dibujar
    effect(() => {
      const configuracion = this.config();
      this.grafico?.destroy();
      this.grafico = new Chart(this.lienzo().nativeElement, configuracion);
    });
  }

  // Liberamos memoria al salir de la página
  ngOnDestroy(): void {
    this.grafico?.destroy();
  }
}