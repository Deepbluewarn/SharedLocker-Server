import passport from 'passport'
import { type IUser } from '../models/Users.js'
import { Types } from 'mongoose'
import LockerService from '../services/locker.services.js'
import { type NextFunction, type Request, type Response } from 'express'
import UserService from '../services/user.services.js'
import { checkUserRole } from '../middlewares/role.js'

export const getUsersLocker = async (req, res, next) => {
  passport.authenticate('user', async (err, user: IUser, info) => {
    const objectId: Types.ObjectId = new Types.ObjectId(user._id)
    const locker = await LockerService.getUserLockerWithShareUserList(objectId)

    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    return res.status(200).json({ success: true, message: '보관함 검색 완료', value: locker })
  })(req, res, next)
}

export const getUsersSharedLocker = async (req, res, next) => {
  passport.authenticate('user', async (err, user: IUser, info) => {
    const objectId: Types.ObjectId = new Types.ObjectId(user._id)
    const locker = await LockerService.getUserSharedLockerWithShareUserList(objectId)

    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    return res.status(200).json({ success: true, message: '공유받은 보관함 검색 완료', value: locker })
  })(req, res, next)
}

export const updateUserRole = [
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
    const { userId, role, assignedLockerBuilding } = req.body

    if(role === 'worker' && !assignedLockerBuilding) {
      return res.status(400).json({ success: false, message: '담당 보관함이 지정되지 않았습니다.' })
    }

    try {
      await UserService.updateUserRole(userId, role, assignedLockerBuilding)

      return res.status(200).json({ success: true, message: '사용자 권한 수정에 성공했습니다.' })
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message })
    }
  }
]
