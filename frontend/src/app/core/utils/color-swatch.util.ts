/**
 * "colors" en Product es texto libre (lo carga quien crea el producto
 * — ver ProductRequest.colors) — no hay una tabla de colores en el
 * backend, así que esto es solo una ayuda VISUAL para pintar el
 * círculo del selector a partir del nombre más común en español. Si
 * el nombre no está en la lista, no inventamos un color: cae a un
 * gris neutro y el nombre se sigue mostrando como texto (por eso el
 * selector de color en el HTML siempre trae el nombre al lado, nunca
 * solo el círculo).
 */
const KNOWN_COLORS: Record<string, string> = {
  negro: '#111111',
  blanco: '#ffffff',
  gris: '#9a9a9a',
  plomo: '#9a9a9a',
  verde: '#3a6b4a',
  'verde oliva': '#6b7a4f',
  azul: '#2f5aa8',
  'azul marino': '#1c2c4a',
  celeste: '#6fa8d8',
  rojo: '#b23b3b',
  vino: '#6b2635',
  rosado: '#e5a0b5',
  rosa: '#e5a0b5',
  morado: '#6b4e9e',
  violeta: '#6b4e9e',
  amarillo: '#e3c23c',
  mostaza: '#c9a227',
  naranja: '#d3792f',
  marrón: '#6b4a34',
  marron: '#6b4a34',
  café: '#6b4a34',
  cafe: '#6b4a34',
  beige: '#d9cdb8',
  crema: '#efe6d3',
  dorado: '#c9a94d',
  plateado: '#c4c4c4'
};

const FALLBACK_COLOR = '#b7b7b7';

export function colorNameToSwatch(name: string): string {
  return KNOWN_COLORS[name.trim().toLowerCase()] ?? FALLBACK_COLOR;
}
