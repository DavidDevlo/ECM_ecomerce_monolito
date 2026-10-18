import { UserResponse } from './user.model';
import { Product } from './product.model';
import { PaymentMethod } from './payment.model';

/** Espejo exacto de OrderStatus.java */
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

/** Espejo de ShippingAddressDto — sirve para request y response. Es una
 *  COPIA dentro del pedido (no una referencia al perfil): si el cliente
 *  cambia su dirección después, los pedidos viejos conservan la que
 *  se usó en ese momento. `reference` es el único campo opcional. */
export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  district: string;
  reference?: string;
}

/** Espejo de OrderDetailResponseDto */
export interface OrderDetail {
  id: number;
  quantity: number;
  unitPrice: number;
  product: Product;
  /** Color/talla elegidos al comprar — null si el producto no definía
   *  colores/tallas, o en pedidos anteriores a este cambio. */
  color?: string | null;
  size?: string | null;
}

/** Espejo de OrderResponseDto */
export interface Order {
  id: number;
  orderDate: string;
  status: OrderStatus;
  user: UserResponse;
  /** Vendedor que aceptó el pedido — null mientras esté PENDING sin asignar. */
  seller: UserResponse | null;
  orderDetails: OrderDetail[];
  /** Null en pedidos creados antes de que existiera la dirección de entrega. */
  shippingAddress?: ShippingAddress | null;
  /** Calculados por el back al crear el pedido. Null en pedidos viejos. */
  subtotal?: number | null;
  shippingCost?: number | null;
  total?: number | null;
  /** Cupón aplicado (null si no hubo) y cuánto descontó, en S/. */
  couponCode?: string | null;
  discountAmount?: number | null;
}

/** Espejo de UserOrderHistoryDto */
export interface UserOrderHistory {
  asBuyer: Order[];
  asSeller: Order[];
}

/** Espejo de OrderRequestDto */
export interface OrderRequest {
  userId: number;
}

/** Espejo de OrderDetailRequestDto */
export interface OrderDetailRequest {
  productId: number;
  quantity: number;
  orderId: number;
}

/** Espejo de CheckoutItemDto — color/size son obligatorios solo si el
 *  producto define colores/tallas (el back responde 400 si faltan o no
 *  existen en ese producto). */
export interface CheckoutItem {
  productId: number;
  quantity: number;
  color?: string;
  size?: string;
}

/** Espejo de CheckoutRequestDto. Ya NO lleva userId: el back lo saca
 *  del JWT (antes aceptarlo en el body era una vulnerabilidad de
 *  ownership). */
export interface CheckoutRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  couponCode?: string;
  items: CheckoutItem[];
}
