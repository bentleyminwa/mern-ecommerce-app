import express from 'express';
import {
    login,
    logout,
    refreshAccessToken,
    signup,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken);
// router.get('/profile', getProfile);

export const authRouter = router;
