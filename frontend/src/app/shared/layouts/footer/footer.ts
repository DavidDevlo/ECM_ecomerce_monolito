import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';


import { NewsletterService } from '../../../core/services/newsletter.service';
import {TrustBar} from '../../../features/trus bar/trust-bar';

const NEWSLETTER_STORAGE_KEY = 'ecm-newsletter-subscribed';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TrustBar],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer implements OnInit {
  year = new Date().getFullYear();

  private newsletterService = inject(NewsletterService);
  private platformId = inject(PLATFORM_ID);

  newsletterLoading = signal(false);
  newsletterError = signal<string | null>(null);
  newsletterSubscribed = signal(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.newsletterSubscribed.set(localStorage.getItem(NEWSLETTER_STORAGE_KEY) === 'true');
    }
  }

  subscribeNewsletter(rawEmail: string): void {
    const email = rawEmail.trim();
    if (!email) return;

    this.newsletterError.set(null);
    this.newsletterLoading.set(true);

    this.newsletterService.subscribe(email).subscribe({
      next: () => {
        this.newsletterLoading.set(false);
        this.newsletterSubscribed.set(true);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(NEWSLETTER_STORAGE_KEY, 'true');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.newsletterLoading.set(false);

        if (err.status === 409) {
          this.newsletterError.set('Ese correo ya está suscrito.');
          return;
        }
        if (err.status === 400) {
          this.newsletterError.set('Ingresa un correo válido.');
          return;
        }
        this.newsletterError.set('No se pudo completar la suscripción. Intenta de nuevo.');
      }
    });
  }
}
