// @ts-ignore
import { environment } from '../../environments/environment';

export const API_BASE = environment.apiUrl;

export const AUTH_ENDPOINTS = {
  login: `${API_BASE}/api/auth/login`,
  // register: `${API_BASE}/api/auth/register`, // habilitar cuando exista en el back
};
