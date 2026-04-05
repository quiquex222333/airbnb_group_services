import { User } from './User';

export interface Session {
  accessToken: string;
  refreshToken?: string; // Optional because refresh endpoint might not return a new one
  expiresIn: number;
  user: User;
}

export interface RefreshSessionResult {
  accessToken: string;
  expiresIn: number;
  user: User;
  newRefreshToken?: string;
}
