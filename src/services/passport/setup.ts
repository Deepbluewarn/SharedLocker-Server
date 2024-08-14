import passport from 'passport'
import { Strategy as KakaoStrategy } from 'passport-kakao'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { type Request } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as JwtStrategy, ExtractJwt, type VerifiedCallback } from 'passport-jwt'

import dotenv from 'dotenv'
import AuthService from '../auth.services.js'
import UserService from '../user.services.js'
import AdminService from '../admin.services.js'

dotenv.config()

passport.use('login',
  new LocalStrategy({ usernameField: 'id' }, async (userId, password, done) => {
    UserService._findUserByUserId(userId).then((user) => {
      if (!user) {
        done(null, false, { success: false, message: '계정이 존재하지 않습니다.' })
      } else {
        AuthService.comparePassword(password, user.password).then((isMatch) => {
          if (isMatch) {
            const {
              token: accessToken, refreshToken
            } = AuthService.generateTokens(user._id, user.userId, user.email, user.nickname)

            user.refreshToken = refreshToken
            user.save()

            done(null, user as Express.User,
              {
                success: true,
                message: '성공적으로 로그인되었습니다.',
                value: { accessToken, refreshToken }
              }
            )
          } else {
            done(null, false, { success: false, message: 'Invalid id or password.' })
          }
        })
      }
    }).catch(err => {
      console.log(err)
      done(null, false, { success: false, message: 'Something went wrong.' })
    })
  })
)

passport.use('web-kakao', new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  callbackURL: process.env.KAKAO_CALLBACK_URL
}, oAuthCallback))

passport.use('native-kakao', new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  callbackURL: process.env.KAKAO_NATIVE_CALLBACK_URL
}, oAuthCallback))

passport.use('web-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, oAuthCallback))

passport.use('native-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_NATIVE_CALLBACK_URL
}, oAuthCallback))

passport.use('web-github', new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
}, oAuthCallback))

passport.use('logout',
  new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: true
  }, (req: Request, jwt_payload, done) => {
    const accessTokenExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();

    UserService._findUserByUserId(jwt_payload.userId).then((user) => {
      if (!user) {
        done(null, false, { success: false, message: 'User not found' })
      } else {
        let refreshRevokePromise = AuthService.revokeRefreshToken(user.refreshToken)
        let accessRevokePromise = AuthService.revokeAccessToken(accessTokenExtractor(req))

        Promise.all([refreshRevokePromise, accessRevokePromise])
          .then(([result1, result2]) => {
            done(null, user as Express.User, { success: true, message: `Logged out. user ${user.id}` })
          })
          .catch((error) => {
            done(null, user as Express.User, { success: false, message: '오류 발생' })
          });
      }
    })
      .catch(err => {
        done(err, false, { success: false, message: err })
      })
  })
)

passport.use('register',
  new LocalStrategy({ usernameField: 'id', passReqToCallback: true }, async (req, userId, password, done) => {
    console.log(`[passport register] userId: ${userId}, password: ${password}`)
    console.log(`[passport register] email: ${req.body.email}, nickname: ${req.body.nickname}`)

    UserService._findUserByUserId(userId)
      .then(async (user) => {
        console.log('[passport register] findUserByObjectId user: ', user)
        if (user) {
          done(null, false, { success: false, message: 'ID already exists.' })
        } else {
          const nickname = req.body.nickname;
          const email = req.body.email;

          UserService.createUser(userId, password, nickname, email)
            .then((user) => {
              console.log('[UserService] saveNewUser newUser: ', user)
              done(null, user, { success: true, message: '성공적으로 가입되었습니다.' })
            })
        }
      })
      .catch((err) => {
        done(err, false, { success: false, message: 'Something went wrong.' })
      })
  })
)

// 일반 권한 확인 (모든 사용자)
passport.use('user',
  new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // jwtFromRequest: (req) => tokenExtractor(req, 'Authorization'),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: true
  }, (req: Request, jwt_payload: JwtPayload, done: VerifiedCallback) => {
    console.log('[passport jwt_payload]: ', jwt_payload)

    if (!jwt_payload) { done(null, false, { success: false, message: '권한 없음' }); return }

    // 토큰의 정보를 기반으로 가입 여부 확인.
    // 토큰에 해당하는 유저가 있으면 해당 유저의 객체를 반환한다.
    UserService.findUserByUserIdWithAdmin(jwt_payload.userId).then((user) => {
      if (user) {
        done(null, user, { success: true, message: '', value: user })
      } else {
        done(null, false, { success: false, message: '유저를 찾을 수 없습니다.' })
      }
    }).catch(err => {
      console.log('[passport user]: ', err)
      done(err, false, { success: false, message: err })
    })
  })
)

// Admins Collection에서 User의 ID로 검색하여 권한을 확인하는 전략

passport.use('admin', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true
}, (req: Request, jwt_payload: JwtPayload, done: VerifiedCallback) => {
  if (!jwt_payload) { done(null, false, { success: false, message: '권한 없음' }); return }

  const user_promise = UserService._findUserByUserId(jwt_payload.userId)

  user_promise.then(user => {
    if (!user) {
      done(null, false, { success: false, message: '유저를 찾을 수 없습니다.' })
    }else {
      AdminService.findAdminByUserObjectId(user._id).then(admin => {
        req.user = user
        req.admin = admin
        req.info = { success: true, message: '', value: user }
        done(null, user, { success: true, message: '', value: user })
      })
    }
  })
}))

// Refresh Token 유효성 확인 및 토큰 재발급 전략
passport.use('token',
  new JwtStrategy({
    // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // refreshToken 값이 있어야 함.
    jwtFromRequest: (req) => refreshTokenExtractor(req),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: true
  }, async (req: Request, jwt_payload: JwtPayload, done: VerifiedCallback) => {
    const jwt_raw = refreshTokenExtractor(req)
    const checkBlackList = await AuthService.checkBlackList(jwt_raw)

    if (checkBlackList) {
      done(null, false, { success: false, message: '블랙리스트에 존재하는 토큰입니다.' })
      return
    }

    if (!jwt_payload) { done(null, false, { success: false, message: '토큰이 존재하지 않습니다.' }); return }

    // DB 의 Refresh Token 과 유저의 RT 를 비교하여 유효성을 확인한다.
    // 만약 일치하면 jwt.verify() 로 유저의 rt 를 한번 더 검증한다.

    UserService._findUserByUserId(jwt_payload.userId).then(user => {
      // 공격자가 Token 을 탈취하여 유저의 AccessToken 을 발급받으면
      // DB 에는 공격자의 RefreshToken 이 저장된다.
      // 정상 유저가 클라이언트에 가지고 있던 RefreshToken 과 DB 의 RT 를 비교해야 한다.
      // 만약 불일치 한 경우 로그아웃.

      if (!user) { done(null, false, { success: false, message: '유저를 찾을 수 없습니다.' }); return }

      // DB 에 RefreshToken 이 없는 경우.
      if (!user.refreshToken) { done(null, false, { success: false, message: 'Refresh Token 이 없습니다.' }); return }

      const dbRefreshToken = jwt.verify(user.refreshToken, process.env.JWT_SECRET) as JwtPayload

      if (jwt_payload.iat !== dbRefreshToken.iat || jwt_payload.exp !== dbRefreshToken.exp) {
        done(null, false, { success: false, message: 'Refresh Token 이 일치하지 않습니다.' }); return
      }

      const { 
        token: newAccessToken, 
        refreshToken: newRefreshToken
      } = AuthService.generateTokens(user._id, user.userId, user.email, user.nickname)

      user.refreshToken = newRefreshToken

      user.save()

      done(null, false, {
        success: true,
        value: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        },
        message: '새로운 토큰이 발급되었습니다.'
      })
    })
  })
)

async function oAuthCallback(accessToken, refreshToken, profile, done) {
  let _user_id = profile.id
  let _nickname = profile.displayName
  let _email = null
  const _provider = profile.provider

  if (profile.provider === 'kakao') {
    _email = null
  } else {
    _email = profile.emails[0].value
  }

  // 만약 기존 유저가 있으면 

  let user = await UserService._findUserByUserId(String(_user_id))
  let isRegister = false

  if (!user) {
    user = await UserService.createOAuthUser(_user_id, _nickname, _email, _provider)
    isRegister = true
  }
  
  const {
    token: _accessToken,
    refreshToken: _refreshToken
  } = AuthService.generateTokens(user._id, user.userId, user.email, user.nickname)

  user.refreshToken = _refreshToken
  user.save()

  done(null, user, {
    success: true, message: isRegister ? 'OAuth 회원가입 성공' : 'OAuth 로그인 성공', value: {
      accessToken: _accessToken,
      refreshToken: _refreshToken
    }
  })
}

const refreshTokenExtractor = (req: Request) => {
  return req.body.refresh_token
}

export default passport
