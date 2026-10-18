// URL base del backend SIN el sufijo /api (los servicios ya agregan /api/...).
// Cámbiala por la dirección pública de tu backend antes de ejecutar `npm run build`.
export const environment = {
  production: true,
  apiUrl: 'http://ecm-alb-984661242.us-east-1.elb.amazonaws.com'
};
