import { type NextFunction, type Request, type Response } from 'express'
import { checkUserRole } from "../middlewares/role.js"
import { IUser } from '../models/Users.js'
import passport from 'passport'
import UserService from '../services/user.services.js'
import authServices from '../services/auth.services.js'


/**
 * 권한 목록을 확인합니다.
 */
export const roleList = [
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('admin', { session: false }, (err, user: IUser, info) => {
      if (err) {
        return res.status(500).json(info)
      }

      if (!user) {
        return res.status(401).json(info)
      }
  
      next()
    })(req, res, next)
  },
  checkUserRole(['operator', 'worker']),
  async (req: Request, res: Response, next: NextFunction) => {
    const roles = await authServices.getRoleList()
    req.info.value = roles
    res.status(200).json(req.info)
  }
]
/**
 * 사용자가 관리자 권한을 가지고 있는지 확인합니다.
 */
export const adminAuthority = [
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('admin', { session: false }, (err, user: IUser, info) => {
      if (err) {
        return res.status(500).json(info)
      }

      if (!user) {
        return res.status(401).json(info)
      }
  
      next()
    })(req, res, next)
  },
  checkUserRole(['operator', 'worker']),
  (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ success: true, message: 'You are an admin' })
  }
]

/**
 * 사용자 검색 기능입니다.
 */
export const searchUser = [
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('admin', { session: false }, (err, user: IUser, info) => {
      console.log('searchUser err', err)
      console.log('searchUser user', user)
      console.log('searchUser info', info)

      if (err) {
        return res.status(500).json(info)
      }

      if (!user) {
        return res.status(401).json(info)
      }
  
      next()
    })(req, res, next)
  },
  checkUserRole(['operator', 'worker']),
  async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ success: false, message: '회원 아이디 혹은 닉네임을 입력하세요.' })
    }

    req.info.value = await UserService.queryUserList(query)

    res.status(200).json(req.info)
  }
]

export const getUserInfoByUserId = [
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('admin', { session: false }, (err, user: IUser, info) => {
      if (err) {
        return res.status(500).json(info)
      }

      if (!user) {
        return res.status(401).json(info)
      }
  
      next()
    })(req, res, next)
  },
  checkUserRole(['operator']),
  async (req: Request, res: Response, next: NextFunction) => {
    // const { userId } = req.body
    const userId = req.query.userId

    if (!userId) {
      return res.status(400).json({ success: false, message: '사용자 ID를 입력해주세요.' })
    }

    req.info.value = await UserService.findUserByUserId(userId as string)

    res.status(200).json(req.info)
  }
]
