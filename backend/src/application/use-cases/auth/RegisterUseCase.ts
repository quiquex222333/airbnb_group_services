import { User, UserRole } from '../../../domain/entities/User';
import { IAuthService } from '../../../domain/interfaces/IAuthService';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

export class RegisterUseCase {
  constructor(private authService: IAuthService) {}

  async execute(input: RegisterInput): Promise<User> {
    // Valido el enum del rol
    if (input.role !== UserRole.GUEST && input.role !== UserRole.HOST) {
      throw new Error('INVALID_ROLE');
    }

    const user = await this.authService.register(
      input.name,
      input.email,
      input.password,
      input.role as UserRole
    );
    return user;
  }
}
