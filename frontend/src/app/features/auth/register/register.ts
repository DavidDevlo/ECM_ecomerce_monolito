import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {UserService} from '../../../core/services/user.service';
import {AuthService} from '../../../core/services/auth.service';



function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['../../../shared/styles/auth-shared.css', './register.css']
})
export class Register {

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      // Refleja @Size(min = 8) de UserRequestDTO en el backend.
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatch }
  );

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMsg.set(null);
    this.loading.set(true);

    const { username, email, password } = this.form.getRawValue();

    // Si llegamos acá porque authGuard nos mandó a crear cuenta (ej.
    // un invitado tocó "Perfil"), returnUrl trae a dónde quería ir
    // originalmente — sin esto, siempre terminaba en /home sin
    // importar qué pantalla protegida buscaba.
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    this.userService.register({ username, email, password }).subscribe({
      next: () => {
        // El registro no devuelve token (UserResponseDto no lo trae),
        // así que iniciamos sesión automáticamente con las mismas
        // credenciales para no pedírselas dos veces al usuario.
        this.authService.login({ username, password }).subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigateByUrl(returnUrl || '/home');
          },
          error: () => {
            // La cuenta sí se creó; si el auto-login falla lo mandamos
            // a loguearse a mano en lugar de dejarlo sin feedback.
            this.loading.set(false);
            this.router.navigate(['/login'], { queryParams: { registered: '1', returnUrl } });
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 409) {
          this.errorMsg.set('Ese usuario o correo ya está registrado.');
        } else if (err.status === 400) {
          // El backend devuelve un mapa de errores por campo (username,
          // email, password). Si quieres mostrarlos campo por campo,
          // aquí es donde se leería err.error en vez de este mensaje genérico.
          this.errorMsg.set('Revisa los datos ingresados.');
        } else {
          this.errorMsg.set('No se pudo completar el registro. Intenta de nuevo.');
        }
      }
    });
  }
}
