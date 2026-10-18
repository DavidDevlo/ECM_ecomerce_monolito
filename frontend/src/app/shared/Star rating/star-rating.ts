import { Component, computed, input } from '@angular/core';

/**
 * Solo lectura — muestra un promedio (puede ser fraccionario, ej. 4.2)
 * con estrellas parcialmente rellenas vía un overlay recortado por
 * ancho. Para el selector interactivo (elegir 1-5 al escribir una
 * reseña) no se usa este componente — ese vive directo en
 * product-detail, porque necesita clicks/hover discretos, no un
 * porcentaje continuo.
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.css'
})
export class StarRating {

  rating = input.required<number>();
  size = input<number>(14);

  fillPercent = computed(() => `${Math.max(0, Math.min(100, (this.rating() / 5) * 100))}%`);
}
