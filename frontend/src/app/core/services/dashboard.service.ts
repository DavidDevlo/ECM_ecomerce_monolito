import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DashboardSummary } from '../models/dashboard.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/admin/dashboard`;

  /** Solo ADMIN — el backend responde 403 a cualquier otro rol. */
  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`);
  }
}
