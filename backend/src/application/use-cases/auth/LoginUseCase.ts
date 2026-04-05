import { Session } from '../../../domain/entities/Session';
import { IAuthService } from '../../../domain/interfaces/IAuthService';

interface LoginInput {
  email: string;
  password: string;
}

export class LoginUseCase {
  constructor(private authService: IAuthService) {}

  async execute(input: LoginInput): Promise<Session> {
    if (!input.email || !input.password) {
      throw new Error('MISSING_CREDENTIALS');
    }

    const session = await this.authService.login(input.email, input.password);
    return session;
  }
}
