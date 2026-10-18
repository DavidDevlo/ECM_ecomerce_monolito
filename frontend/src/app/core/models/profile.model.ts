/** Espejo de ProfileResponseDto — solo lo que necesitamos para
 *  enriquecer la tabla de usuarios con el nombre real. */
export interface Profile {
  id: number;
  fullName: string;
  phone?: string;
  address?: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}
