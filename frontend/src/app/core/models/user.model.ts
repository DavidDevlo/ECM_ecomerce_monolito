/**
 * Espejo exacto de UserRequestDTO / UserResponseDto del backend.
 * Si ya tienes un user.model.ts de una entrega anterior (el que iba
 * con mi AuthService inventado, con roles: string[]), reemplázalo por
 * este — el registro real solo maneja estos 3 campos.
 */
export interface UserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
}
