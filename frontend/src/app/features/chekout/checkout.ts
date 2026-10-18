import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CartService, CartItem } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { CouponService } from '../../core/services/coupon.service';
import { PaymentService } from '../../core/services/payment.service';
import { ShippingService } from '../../core/services/shipping.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { getEffectivePrice } from '../../core/utils/pricing.util';
import { Order, ShippingAddress } from '../../core/models/order.model';
import { CouponPreview } from '../../core/models/coupon.model';
import { PAYMENT_METHODS, Payment, PaymentMethod } from '../../core/models/payment.model';
import { PAYMENT_ACCOUNTS } from '../../core/config/payment-accounts';

type Step = 1 | 2 | 3;

/**
 * Checkout en 3 pasos: 1 Entrega → 2 Pago → 3 Confirmación, y una
 * pantalla final "¡Listo!" con el pedido creado y las instrucciones
 * para pagar (adjuntar número de operación). El pago NO se cobra aquí:
 * el pedido nace PENDING con un pago "por verificar" y el equipo lo
 * confirma al validar la operación (Yape/Plin/transferencia).
 */
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ImageUrlPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private couponService = inject(CouponService);
  private paymentService = inject(PaymentService);
  private platformId = inject(PLATFORM_ID);

  cart = inject(CartService);
  auth = inject(AuthService);
  shipping = inject(ShippingService);

  effectivePrice = getEffectivePrice;
  methods = PAYMENT_METHODS;
  accounts = PAYMENT_ACCOUNTS;

  step = signal<Step>(1);
  submitting = signal(false);
  errorMsg = signal<string | null>(null);

  // ---- Pago ----
  paymentMethod = signal<PaymentMethod>('YAPE');
  paymentReference = signal('');
  selectedMethod = computed(() => this.methods.find((m) => m.value === this.paymentMethod()));

  // ---- Cupón (solo vista previa; el back recalcula) ----
  couponInput = signal('');
  appliedCoupon = signal<CouponPreview | null>(null);
  couponMsg = signal<string | null>(null);
  couponBusy = signal(false);

  discount = computed(() => this.appliedCoupon()?.discountAmount ?? 0);
  discountedSubtotal = computed(() => Math.max(0, this.cart.subtotal() - this.discount()));
  shippingCost = computed(() => this.shipping.costFor(this.discountedSubtotal()));
  total = computed(() => this.discountedSubtotal() + this.shippingCost());

  // ---- Resultado ----
  createdOrder = signal<Order | null>(null);
  createdPayment = signal<Payment | null>(null);
  refSaved = signal(false);
  refBusy = signal(false);
  refError = signal<string | null>(null);
  copied = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.pattern(/\S/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{7,15}$/)]],
    address: ['', [Validators.required, Validators.pattern(/\S/)]],
    district: ['', [Validators.required, Validators.pattern(/\S/)]],
    reference: ['']
  });

  linesWithMissingVariant = computed(() =>
    this.cart.items().filter((item) => this.cart.missingVariant(item) !== null)
  );

  canSubmit = computed(
    () => this.cart.items().length > 0 && this.linesWithMissingVariant().length === 0 && !this.submitting()
  );

  /** Datos del negocio del método elegido (solo los que estén completos). */
  accountRows = computed<{ label: string; value: string }[]>(() => {
    const m = this.paymentMethod();
    const a = this.accounts;
    const rows: { label: string; value: string }[] = [];
    if (m === 'TRANSFER') {
      if (a.TRANSFER.bank) rows.push({ label: 'Banco', value: a.TRANSFER.bank });
      if (a.TRANSFER.holder) rows.push({ label: 'Titular', value: a.TRANSFER.holder });
      if (a.TRANSFER.account) rows.push({ label: 'N.º de cuenta', value: a.TRANSFER.account });
      if (a.TRANSFER.cci) rows.push({ label: 'CCI', value: a.TRANSFER.cci });
    } else {
      const acc = a[m];
      if (acc.number) rows.push({ label: 'Número ' + (m === 'YAPE' ? 'Yape' : 'Plin'), value: acc.number });
      if (acc.holder) rows.push({ label: 'A nombre de', value: acc.holder });
    }
    return rows;
  });

  qrUrl = computed(() => {
    const m = this.paymentMethod();
    return m === 'TRANSFER' ? '' : this.accounts[m].qrUrl;
  });

  ngOnInit(): void {
    this.shipping.load();
    if (!isPlatformBrowser(this.platformId)) return;

    this.profileService
      .getMe()
      .pipe(catchError(() => of(null)))
      .subscribe((profile) => {
        if (!profile) return;
        const { fullName, phone, address } = this.form.controls;
        if (!fullName.value && profile.fullName) fullName.setValue(profile.fullName);
        if (!phone.value && profile.phone) phone.setValue(profile.phone);
        if (!address.value && profile.address) address.setValue(profile.address);
      });
  }

  // ---------- Pasos ----------
  goTo(s: Step): void {
    // Solo se puede volver atrás libremente; avanzar exige validar.
    if (s < this.step()) { this.errorMsg.set(null); this.step.set(s); }
  }

  next(): void {
    this.errorMsg.set(null);
    if (this.step() === 1) {
      if (this.form.invalid) { this.form.markAllAsTouched(); return; }
      this.step.set(2);
    } else if (this.step() === 2) {
      this.step.set(3);
    }
  }

  back(): void {
    this.errorMsg.set(null);
    if (this.step() > 1) this.step.update((s) => (s - 1) as Step);
  }

  // ---------- Cupón ----------
  applyCoupon(): void {
    const code = this.couponInput().trim();
    if (!code) return;
    this.couponBusy.set(true);
    this.couponMsg.set(null);
    this.couponService.validate(code, this.cart.subtotal()).subscribe({
      next: (r) => {
        this.couponBusy.set(false);
        if (r.valid) this.appliedCoupon.set(r);
        else { this.appliedCoupon.set(null); this.couponMsg.set(r.message); }
      },
      error: (err: HttpErrorResponse) => {
        this.couponBusy.set(false);
        this.couponMsg.set((err.error as { message?: string } | null)?.message || 'No se pudo validar el cupón.');
      }
    });
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponInput.set('');
    this.couponMsg.set(null);
  }

  // ---------- Utilidades de UI ----------
  variantLabel(item: CartItem): string {
    const parts: string[] = [];
    if (item.selectedColor) parts.push(item.selectedColor);
    if (item.selectedSize) parts.push('Talla ' + item.selectedSize);
    return parts.join(' · ');
  }

  missingLabel(item: CartItem): string {
    const missing = this.cart.missingVariant(item);
    return missing === 'size' ? 'talla' : (missing ?? '');
  }

  methodLabel(m: PaymentMethod): string {
    return this.methods.find((x) => x.value === m)?.label ?? m;
  }

  copy(value: string): void {
    try {
      navigator.clipboard?.writeText(value);
      this.copied.set(value);
      setTimeout(() => this.copied.set(null), 1500);
    } catch { /* sin portapapeles: no pasa nada */ }
  }

  // ---------- Confirmar ----------
  submit(): void {
    this.errorMsg.set(null);

    if (this.linesWithMissingVariant().length > 0) {
      this.errorMsg.set('Elige color y/o talla en los productos marcados antes de continuar.');
      return;
    }
    if (this.form.invalid) { this.step.set(1); this.form.markAllAsTouched(); return; }
    if (!this.auth.hasRole('ROLE_CLIENTE')) {
      this.errorMsg.set('Solo los clientes pueden completar una compra.');
      return;
    }

    const v = this.form.getRawValue();
    const address: ShippingAddress = {
      fullName: v.fullName.trim(),
      phone: v.phone.trim(),
      address: v.address.trim(),
      district: v.district.trim(),
      reference: v.reference.trim() || undefined
    };

    this.submitting.set(true);
    this.cart
      .checkout(address, this.paymentMethod(), this.paymentReference(), this.appliedCoupon()?.code)
      .subscribe({
        next: (order) => {
          this.submitting.set(false);
          this.createdOrder.set(order);
          this.refSaved.set(!!this.paymentReference().trim());
          // Para poder adjuntar el número de operación después necesitamos el id del pago.
          this.paymentService.getByOrder(order.id).pipe(catchError(() => of([] as Payment[]))).subscribe((list) => {
            this.createdPayment.set(list.length ? list[list.length - 1] : null);
          });
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          if (err.status === 403) {
            this.errorMsg.set('Solo los clientes pueden completar una compra.');
            return;
          }
          // 400 (dirección/variantes/cupón) y 409 (stock) traen `message`.
          const msg = (err.error as { message?: string } | null)?.message;
          this.errorMsg.set(msg || 'No se pudo generar el pedido. Intenta de nuevo.');
        }
      });
  }

  attachReference(value: string): void {
    const ref = value.trim();
    const payment = this.createdPayment();
    if (!ref) { this.refError.set('Ingresa el número de operación.'); return; }
    if (!payment) { this.refError.set('No se encontró el pago. Hazlo desde Mi cuenta → Pedidos.'); return; }
    this.refError.set(null);
    this.refBusy.set(true);
    this.paymentService.attachReference(payment.id, ref).subscribe({
      next: (p) => { this.refBusy.set(false); this.createdPayment.set(p); this.refSaved.set(true); },
      error: (err: HttpErrorResponse) => {
        this.refBusy.set(false);
        this.refError.set((err.error as { message?: string } | null)?.message || 'No se pudo guardar el número de operación.');
      }
    });
  }

  goToOrders(): void {
    this.router.navigateByUrl('/profile');
  }
}
