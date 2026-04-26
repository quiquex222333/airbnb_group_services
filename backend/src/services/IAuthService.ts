import { 
    RegisterInput, RegisterOutput, 
    LoginInput, LoginOutput, 
    ConfirmSignUpInput, ConfirmSignUpOutput,
    RefreshInput, LogoutInput, LogoutOutput
} from '../generated/auth';

export interface IAuthService {
    register(input: RegisterInput): Promise<RegisterOutput>;
    login(input: LoginInput): Promise<LoginOutput>;
    confirmSignUp(input: ConfirmSignUpInput): Promise<ConfirmSignUpOutput>;
    refresh(input: RefreshInput): Promise<LoginOutput>;
    logout(input: LogoutInput): Promise<LogoutOutput>;
}
