import express from 'express'
import { checkLockerAccess, getNewToken, getQrKey, getUser, kakaoLoginCallback, kakaoLoginNativeCallback, loginUser, logoutUser, registerUser, resolveTokenByAuthorizationCode } from '../controller/auth.controller.js'
import passport from 'passport'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)

// 웹 기반 카카오 로그인을 위한 라우터
router.get('/kakao', passport.authenticate('web-kakao'))
router.get('/callback/kakao', kakaoLoginCallback)

// 네이티브 앱 기반 카카오 로그인을 위한 라우터
router.get('/native/kakao', passport.authenticate('native-kakao'))
router.get('/callback/native/kakao', kakaoLoginNativeCallback)
router.post('/resolve-token', resolveTokenByAuthorizationCode)
router.post('/logout', logoutUser)
router.post('/token', getNewToken)
router.get('/qrkey', getQrKey)
router.post('/qrkey', checkLockerAccess)

export default router
