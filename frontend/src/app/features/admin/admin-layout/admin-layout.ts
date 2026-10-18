import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LowStockReport, ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit {
  private reports = inject(ReportService);
  private platformId = inject(PLATFORM_ID);

  report = signal<LowStockReport | null>(null);
  open = signal(false);

  alertCount = computed(() => {
    const r = this.report();
    return r ? r.outOfStockCount + r.lowStockCount : 0;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reports.getLowStock().subscribe({
      next: (r) => this.report.set(r),
      error: () => this.report.set(null)
    });
  }

  toggle(): void {
    this.open.update((v) => !v);
  }
}
