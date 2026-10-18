/** Espejo de NewsletterRequestDto / NewsletterSubscriberResponseDto. */
export interface NewsletterRequest {
  email: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  subscribedAt: string;
}
