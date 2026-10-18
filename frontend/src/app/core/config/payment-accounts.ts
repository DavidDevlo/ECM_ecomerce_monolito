/**
 * Datos del negocio para recibir pagos. COMPLÉTALOS con los reales:
 * si un campo está vacío, el checkout no lo muestra (no se inventan
 * números ni cuentas). `qrUrl` es opcional: ruta a la imagen del QR
 * (por ejemplo '/assets/qr-yape.png').
 */
export const PAYMENT_ACCOUNTS = {
  YAPE: { holder: 'David Naira', number: '981740957', qrUrl: '' },
  PLIN: { holder: 'David Naira', number: '981740957', qrUrl: '' },
  TRANSFER: { bank: 'BCP', holder: '981740957', account: '', cci: '' }
};
