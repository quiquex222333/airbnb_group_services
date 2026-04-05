import { IAuthService } from '../../../domain/interfaces/IAuthService';

export class LogoutUseCase {
  constructor(private authService: IAuthService) {}

  async execute(accessToken: string): Promise<void> {
    if (!accessToken) {
      throw new Error('TOKEN_MISSING');
    }

    await this.authService.logout(accessToken);
  }
}
