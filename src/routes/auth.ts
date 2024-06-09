import express from 'express'
import { checkLockerAccess, getNewToken, getQrKey, getUser, kakaoLoginCallback, loginUser, logoutUser, registerUser } from '../controller/auth.controller.js'
import passport from 'passport'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/kakao', passport.authenticate('kakao'))
router.get('/callback/kakao', kakaoLoginCallback)
router.post('/logout', logoutUser)
router.post('/token', getNewToken)
router.get('/qrkey', getQrKey)
router.post('/qrkey', checkLockerAccess)

export default router
