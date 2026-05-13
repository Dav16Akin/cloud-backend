import {Router} from 'express';
import bcrypt from 'bcryptjs';
import {register} from './auth.controller';

const router = Router();

router.post("/register", register);

export default router;