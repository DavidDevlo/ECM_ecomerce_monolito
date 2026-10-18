import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { UserRole, UserRoleRequest } from '../models/user-role.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserRoleService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/user-roles`;

  getAll(): Observable<UserRole[]> {
    return this.http.get<UserRole[]>(this.baseUrl);
  }

  create(dto: UserRoleRequest): Observable<UserRole> {
    return this.http.post<UserRole>(this.baseUrl, dto);
  }

  update(id: number, dto: UserRoleRequest): Observable<UserRole> {
    return this.http.put<UserRole>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
