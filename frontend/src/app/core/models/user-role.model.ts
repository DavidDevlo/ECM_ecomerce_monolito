import { Role } from './role.model';

export interface UserRoleUserRef {
  id: number;
  username: string;
  email: string;
}

/** Espejo de UserRoleResponseDto */
export interface UserRole {
  id: number;
  assignedAt: string;
  status: boolean;
  user: UserRoleUserRef;
  role: Role;
}

/** Espejo de UserRoleRequestDto */
export interface UserRoleRequest {
  userId: number;
  roleId: number;
  status: boolean;
}
