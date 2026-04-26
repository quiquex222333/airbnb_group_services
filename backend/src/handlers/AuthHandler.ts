import { Request, Response } from 'express';
import { IAuthService } from '../services/IAuthService';

export class AuthHandler {
    constructor(private authService: IAuthService) {}

    public async register(req: Request, res: Response): Promise<void> {
        try {
            const input = req.body;
            const output = await this.authService.register(input);
            res.status(201).json(output);
        } catch (error: any) {
            this.handleError(res, error);
        }
    }

    public async login(req: Request, res: Response): Promise<void> {
        try {
            const input = req.body;
            const output = await this.authService.login(input);

            // BFF Pattern: Refresh token in HttpOnly cookie
            res.cookie('refreshToken', output.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            // Remove refresh token from response body
            const { refreshToken, ...responseBody } = output;
            res.status(200).json(responseBody);
        } catch (error: any) {
            this.handleError(res, error);
        }
    }

    public async confirm(req: Request, res: Response): Promise<void> {
        try {
            const input = req.body;
            const output = await this.authService.confirmSignUp(input);
            res.status(200).json(output);
        } catch (error: any) {
            this.handleError(res, error);
        }
    }

    private handleError(res: Response, error: any): void {
        console.error('AuthHandler Error:', error);
        const statusCode = error.statusCode || 500;
        const code = error.code || 'INTERNAL_SERVER_ERROR';
        res.status(statusCode).json({
            error: {
                code,
                message: error.message
            }
        });
    }
}
