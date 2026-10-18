import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Role } from '../models/role.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/roles`;

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.baseUrl);
  }
}
