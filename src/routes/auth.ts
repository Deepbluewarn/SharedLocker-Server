import express from 'express'
import { checkLockerAccess, getNewToken, getQrKey, getUser, googleLogin, googleLoginCallback, googleLoginNativeCallback, googleNativeLogin, kakaoLogin, kakaoLoginCallback, kakaoLoginNativeCallback, kakaoNativeLogin, loginUser, logoutUser, registerUser, resolveTokenByAuthorizationCode } from '../controller/auth.controller.js'
import passport from 'passport'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)

// 웹 기반 카카오 로그인을 위한 라우터
router.get('/kakao', kakaoLogin)
router.get('/callback/kakao', kakaoLoginCallback)

// 네이티브 앱 기반 카카오 로그인을 위한 라우터
router.get('/native/kakao', kakaoNativeLogin)
router.get('/callback/native/kakao', kakaoLoginNativeCallback)

router.get('/google', googleLogin)
router.get('/callback/google', googleLoginCallback)

router.get('/native/google', googleNativeLogin)
router.get('/callback/native/google', googleLoginNativeCallback)

router.post('/resolve-token', resolveTokenByAuthorizationCode)
router.post('/logout', logoutUser)
router.post('/token', getNewToken)
router.get('/qrkey', getQrKey)
router.post('/qrkey', checkLockerAccess)

export default router
