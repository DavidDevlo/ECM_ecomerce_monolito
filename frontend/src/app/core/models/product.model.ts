/**
 * Mismo caso: si ya tienes product.model.ts, verifica que 'Product'
 * tenga estos campos (sobre todo 'description', que tu página pública
 * no muestra pero el backend sí devuelve) y agrega ProductRequest.
 */
import { Category } from './category.model';

/** Espejo de ProductImageDto — fotos adicionales a imageUrl (galería:
 *  otros ángulos, detalles), que se agregan/quitan una por una vía
 *  POST/DELETE /api/products/{id}/images en vez de venir en el DTO
 *  de creación/edición. */
export interface ProductImage {
  id: number;
  url: string;
  displayOrder: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  stock: number;
  category: Category;
  /** Opcional — todavía no existe en el backend. Cuando lo agregues
   *  (0-100, nullable), esto ya está listo para recibirlo sin tocar
   *  nada más. */
  discountPercentage?: number;
  /** Etiquetas simples — no afectan stock ni checkout, son solo
   *  informativas (versión "no invasiva" que eligió el backend). */
  colors?: string[];
  sizes?: string[];
  /** Fotos adicionales, ordenadas por displayOrder. imageUrl sigue
   *  siendo la principal — esto es solo la galería extra. */
  images?: ProductImage[];
}

export interface ProductRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  stock: number;
  categoryId: number;
  discountPercentage?: number;
  colors?: string[];
  sizes?: string[];
}
