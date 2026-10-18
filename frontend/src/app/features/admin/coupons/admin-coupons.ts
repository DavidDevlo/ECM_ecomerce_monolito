import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CouponService } from '../../../core/services/coupon.service';
import { Coupon, CouponRequest, DiscountType } from '../../../core/models/coupon.model';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-coupons.html',
  styleUrl: './admin-coupons.css'
})
export class AdminCoupons implements OnInit {
  private api = inject(CouponService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  showForm = signal(false);
  editing = signal<Coupon | null>(null);
  confirmingDeleteId = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    type: ['PERCENT' as DiscountType, Validators.required],
    value: [10, [Validators.required, Validators.min(0.01)]],
    minOrderAmount: [null as number | null],
    maxUses: [null as number | null],
    expiresAt: [''],
    active: [true]
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getAll().subscribe({
      next: (list) => { this.coupons.set(list); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('No se pudieron cargar los cupones.'); }
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ code: '', type: 'PERCENT', value: 10, minOrderAmount: null, maxUses: null, expiresAt: '', active: true });
    this.form.controls.code.enable();
    this.error.set(null);
    this.showForm.set(true);
  }

  openEdit(c: Coupon): void {
    this.editing.set(c);
    this.form.reset({
      code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount,
      maxUses: c.maxUses, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : '', active: c.active
    });
    this.form.controls.code.disable(); // el código no cambia al editar
    this.error.set(null);
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const dto: CouponRequest = {
      code: v.code.trim(),
      type: v.type,
      value: Number(v.value),
      minOrderAmount: v.minOrderAmount != null && `${v.minOrderAmount}` !== '' ? Number(v.minOrderAmount) : null,
      maxUses: v.maxUses != null && `${v.maxUses}` !== '' ? Number(v.maxUses) : null,
      expiresAt: v.expiresAt || null,
      active: v.active
    };
    this.saving.set(true);
    this.error.set(null);
    const editing = this.editing();
    const req = editing ? this.api.update(editing.id, dto) : this.api.create(dto);
    req.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set((err.error as { message?: string } | null)?.message || 'No se pudo guardar el cupón.');
      }
    });
  }

  toggleActive(c: Coupon): void {
    this.api.update(c.id, {
      code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount,
      maxUses: c.maxUses, expiresAt: c.expiresAt, active: !c.active
    }).subscribe({
      next: () => this.load(),
      error: (err: HttpErrorResponse) =>
        this.error.set((err.error as { message?: string } | null)?.message || 'No se pudo actualizar.')
    });
  }

  confirmDelete(id: number): void {
    this.api.delete(id).subscribe({
      next: () => { this.confirmingDeleteId.set(null); this.coupons.update((l) => l.filter((c) => c.id !== id)); },
      error: (err: HttpErrorResponse) => {
        this.confirmingDeleteId.set(null);
        this.error.set((err.error as { message?: string } | null)?.message || 'No se pudo eliminar.');
      }
    });
  }

  valueLabel(c: Coupon): string {
    return c.type === 'PERCENT' ? `${c.value}%` : `S/ ${c.value.toFixed(2)}`;
  }

  isExpired(c: Coupon): boolean {
    return !!c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
  }
}
