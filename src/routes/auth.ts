import express from 'express';
import { checkLockerAccess, getNewToken, getQrKey, getUser, loginUser, logoutUser, registerUser } from '../controller/auth.controller.js';

const router = express.Router();

router.post("/register", registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/token', getNewToken);
router.get('/user', getUser);
router.get('/qrkey', getQrKey);
router.post('/qrkey', checkLockerAccess);

export default router;