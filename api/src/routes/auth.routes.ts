import { Router } from 'express';
import { loginController, meController, pinLoginController, pinRosterController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 60_000, max: 10, keyFn: (req) => `login:${req.ip}` });
const pinLimiter = rateLimit({
  windowMs: 60_000,
  max: 8,
  keyFn: (req) => `pin:${req.ip}:${(req.body as { studentId?: string })?.studentId ?? ''}`,
});

authRouter.post('/login', loginLimiter, loginController);
authRouter.get('/pin-roster', pinRosterController);
authRouter.post('/pin-login', pinLimiter, pinLoginController);
authRouter.get('/me', requireAuth, meController);
