export enum UserRole {
  GUEST = 'guest',
  HOST = 'host',
}

export type UserStatus = 'UNCONFIRMED' | 'CONFIRMED' | 'FORCE_CHANGE_PASSWORD';

export interface User {
  id: string; // Cognito sub UUID
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
}
