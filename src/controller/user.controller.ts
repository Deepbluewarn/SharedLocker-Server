import passport from 'passport'
import { type IUser } from '../models/Users.js'
import { Types } from 'mongoose'
import LockerService from '../services/locker.services.js'

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

    return res.status(200).json({ success: true, message: '보관함 검색 완료', locker })
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

    return res.status(200).json({ success: true, message: '공유받은 보관함 검색 완료', locker })
  })(req, res, next)
}
