import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { UserRequest, UserResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/users`;

  register(dto: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, dto);
  }

  /** Tus propios datos (id/username/email). Cualquier autenticado puede
   *  llamarlo — úsalo en vez de getAll() para resolver "quién soy yo". */
  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/me`);
  }

  /** Solo ADMIN — el backend responde 403 a cualquier otro rol. */
  getAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.baseUrl);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
