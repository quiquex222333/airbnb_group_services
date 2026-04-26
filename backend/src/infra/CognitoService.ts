import { 
    CognitoIdentityProviderClient, 
    SignUpCommand, 
    InitiateAuthCommand, 
    ConfirmSignUpCommand,
    GlobalSignOutCommand,
    GetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { IAuthService } from "../services/IAuthService";
import { 
    RegisterInput, RegisterOutput, 
    LoginInput, LoginOutput, 
    ConfirmSignUpInput, ConfirmSignUpOutput 
} from "../generated/auth";

export class CognitoService implements IAuthService {
    private client: CognitoIdentityProviderClient;
    private clientId: string;

    constructor() {
        this.client = new CognitoIdentityProviderClient({ 
            region: process.env.AWS_REGION || 'us-east-2' 
        });
        this.clientId = process.env.COGNITO_CLIENT_ID || '';
    }

    async register(input: RegisterInput): Promise<RegisterOutput> {
        const command = new SignUpCommand({
            ClientId: this.clientId,
            Username: input.email,
            Password: input.password,
            UserAttributes: [
                { Name: 'email', Value: input.email },
                { Name: 'name', Value: input.name },
                { Name: 'custom:role', Value: input.role }
            ]
        });

        try {
            const response = await this.client.send(command);
            return {
                userId: response.UserSub || '',
                email: input.email
            };
        } catch (error: any) {
            if (error.name === 'UsernameExistsException') {
                const conflictError = new Error('User already exists');
                (conflictError as any).code = 'CONFLICT_ERROR';
                (conflictError as any).statusCode = 409;
                throw conflictError;
            }
            throw error;
        }
    }

    async login(input: LoginInput): Promise<LoginOutput> {
        const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: this.clientId,
            AuthParameters: {
                USERNAME: input.email,
                PASSWORD: input.password
            }
        });

        const response = await this.client.send(command);
        
        if (!response.AuthenticationResult) {
            throw new Error('Authentication failed');
        }

        // Obtener perfil para el LoginOutput
        const userCommand = new GetUserCommand({
            AccessToken: response.AuthenticationResult.AccessToken
        });
        const userRes = await this.client.send(userCommand);
        const name = userRes.UserAttributes?.find(a => a.Name === 'name')?.Value || '';
        const role = userRes.UserAttributes?.find(a => a.Name === 'custom:role')?.Value || 'guest';

        return {
            accessToken: response.AuthenticationResult.AccessToken!,
            refreshToken: response.AuthenticationResult.RefreshToken!,
            expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
            user: {
                id: userRes.Username || '',
                email: input.email,
                name: name,
                role: role
            }
        };
    }

    async confirmSignUp(input: ConfirmSignUpInput): Promise<ConfirmSignUpOutput> {
        const command = new ConfirmSignUpCommand({
            ClientId: this.clientId,
            Username: input.email,
            ConfirmationCode: input.code
        });

        await this.client.send(command);
        return { message: 'User confirmed successfully' };
    }

    async logout(accessToken: string): Promise<void> {
        const command = new GlobalSignOutCommand({
            AccessToken: accessToken
        });
        await this.client.send(command);
    }
}
