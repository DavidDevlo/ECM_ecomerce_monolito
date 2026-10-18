import { Pipe, PipeTransform } from '@angular/core';
import { getImageUrl } from '../../core/utils/image-url.util';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {

  transform(imageUrl?: string | null): string | null {
    return getImageUrl(imageUrl);
  }
}
