import { environment } from '../../environments/environment';

const BACKEND_URL = environment.apiUrl.replace(/\/api\/?$/, '');

export function getImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:')
  ) {
    // Ya es una URL absoluta o un data URI (preview local desde
    // FileReader antes de subir la imagen) — no se toca.
    return imageUrl;
  }

  return `${BACKEND_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
}
