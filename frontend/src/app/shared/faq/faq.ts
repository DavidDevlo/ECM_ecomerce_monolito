import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class Faq {

  items: FaqItem[] = [
    {
      question: '¿Cómo hago un pedido?',
      answer: 'Agrega productos al carrito desde el catálogo y confirma tu pedido desde ahí. Necesitas una cuenta con rol Cliente para completar la compra.'
    },
    {
      question: '¿Qué pasa después de comprar?',
      answer: 'Tu pedido queda como "Pendiente" hasta que un vendedor lo confirma. Puedes seguir su estado paso a paso desde tu perfil.'
    },
    {
      question: '¿Puedo cancelar un pedido?',
      answer: 'Sí, mientras siga en estado "Pendiente" puedes cancelarlo desde tu perfil. Una vez que un vendedor lo confirma, la cancelación ya no depende de ti.'
    },
    {
      question: '¿Cómo sé si un producto tiene descuento?',
      answer: 'Los productos en oferta muestran una etiqueta con el porcentaje de descuento, tanto en el catálogo como en su ficha.'
    },
    {
      question: '¿Qué pasa si un producto se queda sin stock?',
      answer: 'El catálogo lo marca como "Sin stock" y no se puede agregar al carrito hasta que vuelva a haber disponibilidad.'
    }
  ];

  openIndex = signal<number | null>(0);

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }
}
