import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Pantalla temporal para rutas cuya funcionalidad real aún no existe
 * (Perfil, Admin, detalle de producto, 404...). El título y la
 * descripción se inyectan desde `data` en app.routes.ts gracias a
 * withComponentInputBinding() en provideRouter (ver README de este entregable).
 */
@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './placeholder.html',
  styleUrl: './placeholder.css'
})
export class PlaceholderComponent {
  title = input<string>('Próximamente');
  description = input<string>('Estamos construyendo esta sección. Vuelve pronto.');
}
