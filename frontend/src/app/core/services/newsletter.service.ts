import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { NewsletterRequest, NewsletterSubscriber } from '../models/newsletter.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NewsletterService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/newsletter`;

  /** Público — el formulario del footer. */
  subscribe(email: string): Observable<void> {
    const dto: NewsletterRequest = { email };
    return this.http.post<void>(this.baseUrl, dto);
  }

  /** Solo ADMIN — el backend responde 403 a cualquier otro rol. */
  getAll(): Observable<NewsletterSubscriber[]> {
    return this.http.get<NewsletterSubscriber[]>(this.baseUrl);
  }
}
