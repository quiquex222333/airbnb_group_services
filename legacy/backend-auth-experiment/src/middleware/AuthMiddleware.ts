import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Extendiendo la interfaz de Request de Express para incluir el usuario
declare global {
    namespace Express {
        interface Request {
            user?: {
                sub: string;
                email?: string;
                role?: string;
                username: string;
            };
        }
    }
}

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    tokenUse: "access",
    clientId: process.env.COGNITO_CLIENT_ID || '',
});

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'No token provided'
            }
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = await verifier.verify(token);
        
        // Inyectamos la información del usuario en la request
        req.user = {
            sub: payload.sub,
            email: payload.email as string,
            role: payload['custom:role'] as string,
            username: payload.username as string
        };

        next();
    } catch (err) {
        console.error("Token validation error:", err);
        return res.status(401).json({
            error: {
                code: 'TOKEN_INVALID',
                message: 'Invalid or expired token'
            }
        });
    }
};
