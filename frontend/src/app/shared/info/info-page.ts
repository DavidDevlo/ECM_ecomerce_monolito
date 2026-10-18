import { Component, input } from '@angular/core';

/**
 * Página estática genérica para contenido legal/informativo simple
 * (Términos, Privacidad, Envíos). Recibe título + párrafos por `data`
 * en la ruta — mismo patrón que PlaceholderComponent, pero con
 * contenido real en vez de "en construcción".
 */
@Component({
  selector: 'app-info-page',
  standalone: true,
  templateUrl: './info-page.html',
  styleUrl: './info-page.css'
})
export class InfoPage {
  title = input.required<string>();
  paragraphs = input<string[]>([]);
}
