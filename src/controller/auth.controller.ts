import { type NextFunction, type Request, type Response } from 'express'
import passport from 'passport'
import { type IUser } from '../models/Users'
import AuthService from '../services/auth.services.js'
import LockerService from '../services/locker.services.js'
import { Types } from 'mongoose'

// type tokenType = 'accessToken' | 'refreshToken'

export const setTokenCookie = (res: Response, name: string, token: string | null) => {
  res.cookie(name, token, {
    domain: `.${process.env.API_DOMAIN}`,
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
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

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('logout', (err, user: IUser, info) => {
    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    res.clearCookie('Authorization')
    res.clearCookie('refreshToken')

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
      let message = '오류 발생!'

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

    const qrKey = await AuthService.generateQrKey(user._id)
    res.status(200).json({ success: true, message: 'QR키 생성 완료', value: qrKey })
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
