import { RefreshSessionResult } from '../../../domain/entities/Session';
import { IAuthService } from '../../../domain/interfaces/IAuthService';

export class RefreshSessionUseCase {
  constructor(private authService: IAuthService) {}

  async execute(refreshToken: string): Promise<RefreshSessionResult> {
    if (!refreshToken) {
      throw new Error('TOKEN_MISSING');
    }

    const result = await this.authService.refreshSession(refreshToken);
    return result;
  }
}
