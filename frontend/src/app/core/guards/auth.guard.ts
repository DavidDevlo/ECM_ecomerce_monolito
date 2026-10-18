import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Bloquea rutas a usuarios no autenticados y los manda a crear cuenta
 * (conservando la URL de retorno) — si ya tienen una, "¿Ya tienes
 * cuenta? Inicia sesión" está ahí mismo en /register.
 *
 * OJO: antes esto apuntaba a '/auth/login', ruta que no existe en
 * app.routes.ts (el login real vive en '/login', sin el prefijo) —
 * por eso cualquier pantalla protegida (ej. /profile) para un
 * invitado terminaba cayendo en el 404 en vez de mandarlo a loguearse.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/register'], { queryParams: { returnUrl: state.url } });
  return false;
};
