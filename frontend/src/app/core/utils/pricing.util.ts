import { Product } from '../models/product.model';

/**
 * Único lugar donde se calcula el precio real a pagar (precio menos
 * el descuento, si tiene). Antes cada pantalla lo hacía a su manera:
 * product-detail sí lo aplicaba, pero el catálogo, el carrito, la
 * wishlist y los carruseles solo mostraban el precio crudo — el
 * "-20%" se veía como badge, pero el número de al lado no bajaba.
 * Cualquier pantalla que muestre un precio al comprador debe pasar
 * por acá, nunca leer product.price directo cuando puede haber
 * descuento.
 */
export function getEffectivePrice(product: Pick<Product, 'price' | 'discountPercentage'>): number {
  if (!product.discountPercentage) return product.price;
  return product.price * (1 - product.discountPercentage / 100);
}
