/**
 * Si ya tienes category.model.ts (lo usa tu página pública de
 * Productos), solo verifica que 'Category' tenga estos campos y
 * agrega la interfaz CategoryRequest si te falta.
 */
export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}
