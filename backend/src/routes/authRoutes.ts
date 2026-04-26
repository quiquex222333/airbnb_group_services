import { Router } from 'express';
import { AuthHandler } from '../handlers/AuthHandler';
import { CognitoService } from '../infra/CognitoService';
import { authMiddleware } from '../middleware/AuthMiddleware';

const authRouter = Router();

// Inyección de dependencias
const authService = new CognitoService();
const authHandler = new AuthHandler(authService);

// Rutas Públicas
authRouter.post('/register', (req, res) => authHandler.register(req, res));
authRouter.post('/confirm', (req, res) => authHandler.confirm(req, res));
authRouter.post('/login', (req, res) => authHandler.login(req, res));

// Rutas Protegidas (ejemplo para obtener el perfil)
authRouter.get('/me', authMiddleware, (req, res) => {
    res.status(200).json(req.user);
});

export { authRouter };
