import { type NextFunction, type Request, type Response } from 'express'
import passport from 'passport'
import { type IUser } from '../models/Users'
import AuthService from '../services/auth.services.js'
import LockerService from '../services/locker.services.js'
import { Types } from 'mongoose'
import { redisQRClient } from '../db/redis_init.js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

// type tokenType = 'accessToken' | 'refreshToken'

export const setTokenCookie = (res: Response, name: string, token: string | null) => {
  res.cookie(name, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  })
}

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('register', (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    res.status(200).json(info)
  })(req, res, next)
}

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('login', (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    setTokenCookie(res, process.env.REFRESH_TOKEN_COOKIE_NAME, info.value.refreshToken);
    setTokenCookie(res, process.env.ACCESS_TOKEN_COOKIE_NAME, info.value.accessToken);

    res.status(200).json(info)
  })(req, res, next)
}

export const kakaoLogin = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('web-kakao', {
    prompt: 'login'
  }, (err, user, info) => {
  })(req, res, next)
}

export const kakaoNativeLogin = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('native-kakao', {
    prompt: 'login'
  }, (err, user, info) => {
  })(req, res, next)
}

export const kakaoLoginCallback = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('web-kakao', {prompt: 'login'}, (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    setTokenCookie(res, process.env.REFRESH_TOKEN_COOKIE_NAME, info.value.refreshToken);
    setTokenCookie(res, process.env.ACCESS_TOKEN_COOKIE_NAME, info.value.accessToken);

    res.redirect('/')
  })(req, res, next)
}

export const kakaoLoginNativeCallback = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('native-kakao', {prompt: 'login'}, async (err, user: IUser, info) => {
    
    console.log('kakaoLoginNativeCallback info: ', info)
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }
    
    const code = crypto.randomBytes(16).toString('hex')

    await redisQRClient.set(code, JSON.stringify(info.value), 'EX', 30)
    
    res.redirect(`sharedlocker://welcome?code=${code}`)
  })(req, res, next)
}

export const githubLogin = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('web-github', { scope: [ 'user:email' ], prompt: 'login' })(req, res, next)
}

export const githubLoginCallback = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('web-github', {prompt: 'login'}, (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    setTokenCookie(res, process.env.REFRESH_TOKEN_COOKIE_NAME, info.value.refreshToken);
    setTokenCookie(res, process.env.ACCESS_TOKEN_COOKIE_NAME, info.value.accessToken);

    res.redirect('/')
  })(req, res, next)
}

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('web-google', {
    scope: [ 'profile', 'email' ],
    prompt: 'login'
  }, (err, user, info) => {
  })(req, res, next)
}

export const googleNativeLogin = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('native-google', {
    scope: [ 'profile', 'email' ],
    prompt: 'login'
  }, (err, user, info) => {
  })(req, res, next)
}

export const googleLoginCallback = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('web-google', {prompt: 'login'}, (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    setTokenCookie(res, process.env.REFRESH_TOKEN_COOKIE_NAME, info.value.refreshToken);
    setTokenCookie(res, process.env.ACCESS_TOKEN_COOKIE_NAME, info.value.accessToken);

    res.redirect('/')
  })(req, res, next)
}

export const googleLoginNativeCallback = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('native-google', {prompt: 'login'}, async (err, user: IUser, info) => {
    
    console.log('googleLoginNativeCallback info: ', info)
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }
    
    const code = crypto.randomBytes(16).toString('hex')

    await redisQRClient.set(code, JSON.stringify(info.value), 'EX', 30)
    
    res.redirect(`sharedlocker://welcome?code=${code}`)
  })(req, res, next)
}

export const resolveTokenByAuthorizationCode = async (req: Request, res: Response, next: NextFunction) => {
  const code = req.body.code

  if (!code) {
    res.status(400).json({ success: false, message: '코드가 없습니다.' })
    return
  }

  const token = await redisQRClient.get(code)

  if (!token) {
    res.status(400).json({ success: false, message: '코드가 유효하지 않습니다.' })
    return
  }

  const tokenObj = JSON.parse(token)

  await redisQRClient.del(code)

  res.status(200).json({ success: true, message: '토큰 발급 완료', value: tokenObj })
}

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('logout', (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    res.status(200).json(info)
  })(req, res, next)
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('user', (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    res.status(200).json(info)
  })(req, res, next)
}

export const getNewToken = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('token', (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }
    if (!info.success) {
      let message = info.message

      if (info instanceof Error) {
        message = info.message
      }

      return res.status(400).json({ success: false, message})
    }

    setTokenCookie(res, process.env.REFRESH_TOKEN_COOKIE_NAME, info.refreshToken);
    setTokenCookie(res, process.env.ACCESS_TOKEN_COOKIE_NAME, info.accessToken);

    res.status(200).json(info)
  })(req, res, next)
}

export const getQrKey = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('user', async (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }
    if (!info.success) {
      return res.status(400).json(info)
    }

    const buildingNumber = Number(req.query.buildingNumber)
    const floor = Number(req.query.floor)
    const lockerNumber = Number(req.query.lockerNumber)

    const qrKey = await AuthService.generateQrKey(user._id)

    // 회원의 _id와 보관함 정보를 기반으로 JWT 생성

    const token = jwt.sign(
      { _id: user._id, buildingNumber, floor, lockerNumber },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION_TIME
      }
    )
    res.status(200).json({ success: true, message: 'QR키 생성 완료', value: {qrKey, token} })
  })(req, res, next)
}

export const checkLockerAccess = async (req: Request, res: Response, next: NextFunction) => {
  // body 안에 있는 userid, buildingid 를 가져옴
  const { qrKey } = req.body;
  const buildingNumber = Number(req.body.buildingNumber);
  const floorNumber = Number(req.body.floorNumber);
  const lockerNumber = Number(req.body.lockerNumber);
  const redisUserId = await AuthService.getUserIdByQrKey(qrKey)

  if (!redisUserId) {
    res.status(400).json({ success: false, message: 'QR키가 유효하지 않습니다.' })
    return
  }

  // mongoose userid 생성
  const userId = new Types.ObjectId(redisUserId)

  const access = await LockerService.checkLockerAccessByUserId(userId, buildingNumber, floorNumber, lockerNumber)

  if (access.success) {
    res.status(200).json(access)
  } else {
    res.status(400).json(access)
  }
}
