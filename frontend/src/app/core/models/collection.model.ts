import { Product } from './product.model';

/** Espejo de CollectionResponseDto */
export interface Collection {
  id: number;
  name: string;
  slogan: string;
  active: boolean;
  products: Product[];
}

/** Espejo de CollectionRequestDto */
export interface CollectionRequest {
  name: string;
  slogan: string;
  active?: boolean;
  productIds: number[];
}
