import { 
    RegisterInput, RegisterOutput, 
    LoginInput, LoginOutput, 
    ConfirmSignUpInput, ConfirmSignUpOutput 
} from '../generated/auth';

export interface IAuthService {
    register(input: RegisterInput): Promise<RegisterOutput>;
    login(input: LoginInput): Promise<LoginOutput>;
    confirmSignUp(input: ConfirmSignUpInput): Promise<ConfirmSignUpOutput>;
    logout(accessToken: string): Promise<void>;
}
