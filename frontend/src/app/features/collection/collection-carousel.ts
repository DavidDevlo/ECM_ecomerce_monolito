import { Component, ElementRef, ViewChild, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


import { Product } from '../../core/models/product.model';
import { getEffectivePrice } from '../../core/utils/pricing.util';
import {ImageUrlPipe} from '../../shared/pipes/image-url.pipe';

/**
 * Presentacional y reutilizable a propósito: hoy recibe agrupaciones
 * temporales (por categoría, por más reciente). El día que exista el
 * backend de Collection, este componente no cambia — solo cambia de
 * dónde saca 'title'/'slogan'/'products' quien lo use.
 */
@Component({
  selector: 'app-collection-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './collection-carousel.html',
  styleUrl: './collection-carousel.css'
})
export class CollectionCarousel {

  title = input.required<string>();
  slogan = input<string | undefined>(undefined);
  products = input.required<Product[]>();

  effectivePrice = getEffectivePrice;

  @ViewChild('track') private trackRef?: ElementRef<HTMLDivElement>;

  scroll(direction: 1 | -1): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  }
}
