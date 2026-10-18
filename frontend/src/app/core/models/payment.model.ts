/** Espejo de PaymentMethod.java */
export type PaymentMethod = 'YAPE' | 'PLIN' | 'TRANSFER';

/** El back no especificó los valores de PaymentStatus; se tipa abierto
 *  y se mapea a etiquetas con tolerancia (ver paymentStatusLabel). */
export type PaymentStatus = string;

/** Espejo de PaymentResponseDto */
export interface Payment {
  id: number;
  orderId: number;
  customerUsername: string;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  status: PaymentStatus;
  createdAt: string;
  reviewedAt: string | null;
}

export interface PaymentRequest {
  method: PaymentMethod;
  reference?: string;
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: 'YAPE', label: 'Yape', hint: 'Paga desde tu app Yape y envía el número de operación.' },
  { value: 'PLIN', label: 'Plin', hint: 'Paga desde tu app Plin y envía el número de operación.' },
  { value: 'TRANSFER', label: 'Transferencia', hint: 'Transferencia bancaria; indica el número de operación.' }
];

export function paymentMethodLabel(m: PaymentMethod): string {
  return PAYMENT_METHODS.find((x) => x.value === m)?.label ?? m;
}

export function paymentStatusLabel(s: PaymentStatus): string {
  switch (String(s).toUpperCase()) {
    case 'PENDING': return 'Por verificar';
    case 'CONFIRMED': case 'APPROVED': case 'PAID': return 'Confirmado';
    case 'REJECTED': return 'Rechazado';
    default: return s;
  }
}
