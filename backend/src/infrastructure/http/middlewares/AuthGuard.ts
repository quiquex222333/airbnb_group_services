import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { env } from '../../../config/env';

// We create a singleton verifier for the user pool
const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: env.COGNITO_CLIENT_ID,
});

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifier.verify(token);
    // Inject the decoded payload to the request
    (req as any).user = payload;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Token expired or invalid' } });
  }
};
