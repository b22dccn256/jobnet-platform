import { Role } from '../enums/role.enum';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: Role;
}
