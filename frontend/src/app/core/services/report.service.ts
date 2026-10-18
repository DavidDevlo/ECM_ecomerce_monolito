import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

export interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  [key: string]: unknown;
}

/** GET /api/admin/reports/low-stock */
export interface LowStockReport {
  outOfStockCount: number;
  lowStockCount: number;
  products: LowStockProduct[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private base = `${environment.apiUrl}/api/admin/reports`;

  getLowStock(): Observable<LowStockReport> {
    return this.http.get<LowStockReport>(`${this.base}/low-stock`);
  }

  downloadSales(): void { this.downloadCsv('sales'); }
  downloadInventory(): void { this.downloadCsv('inventory'); }
  downloadCustomers(): void { this.downloadCsv('customers'); }

  /** Descarga un CSV con el token (el interceptor lo agrega): el endpoint
   *  no se puede abrir con un <a href>. */
  private downloadCsv(kind: 'sales' | 'inventory' | 'customers'): void {
    const date = new Date().toISOString().slice(0, 10);
    this.http.get(`${this.base}/${kind}/csv`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${kind}-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.show('No se pudo descargar el reporte.', 'error')
    });
  }
}
