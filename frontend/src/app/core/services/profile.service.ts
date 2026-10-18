import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Profile } from '../models/profile.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/profiles`;

  /** Solo ADMIN — el backend responde 403 a cualquier otro rol. */
  getAll(): Observable<Profile[]> {
    return this.http.get<Profile[]>(this.baseUrl);
  }

  /** Tu propio perfil (o null si todavía no lo creaste). Cualquier
   *  autenticado puede llamarlo — úsalo en vez de getAll() en /profile. */
  getMe(): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/me`);
  }
}
