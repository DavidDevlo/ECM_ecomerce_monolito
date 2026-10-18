import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Collection, CollectionRequest } from '../models/collection.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CollectionService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/collections`;

  /** Público — el backend ya filtra a solo las activas. Úsalo en el catálogo. */
  getAll(): Observable<Collection[]> {
    return this.http.get<Collection[]>(this.baseUrl);
  }

  /** Solo ADMIN — incluye inactivas, para poder gestionarlas todas. */
  getAllIncludingInactive(): Observable<Collection[]> {
    return this.http.get<Collection[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<Collection> {
    return this.http.get<Collection>(`${this.baseUrl}/${id}`);
  }

  create(dto: CollectionRequest): Observable<Collection> {
    return this.http.post<Collection>(this.baseUrl, dto);
  }

  update(id: number, dto: CollectionRequest): Observable<Collection> {
    return this.http.put<Collection>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
