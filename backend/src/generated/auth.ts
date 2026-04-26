export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    role: 'guest' | 'host';
}

export interface RegisterOutput {
    userId: string;
    email: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginOutput {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export interface ConfirmSignUpInput {
    email: string;
    code: string;
}

export interface ConfirmSignUpOutput {
    message: string;
}
