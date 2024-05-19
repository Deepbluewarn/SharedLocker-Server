import { type NextFunction, type Response, type Request } from 'express'
import LockerService from '../services/locker.services.js'
import passport from '../services/passport/setup.js'
import { Types } from 'mongoose'
import { type IUser } from '../models/Users.js'

export const getAllBuildingList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // MongoDB의 distinct를 사용하여 중복되지 않는 건물 목록을 가져옴
    const buildings = await LockerService.getAllBuildingList()

    res.json({
      success: true,
      message: '건물 목록을 불러왔습니다.',
      value: buildings
    })
  } catch (error) { /* empty */ }
}

export const getAllFloorByBuildingName = async (req: Request, res: Response, next: NextFunction) => {
  const buildingName = req.query.buildingName as string

  if (!buildingName) {
    res.status(400).json({ error: 'Invalid query parameters' })
    return
  }

  try {
    const floors = await LockerService.getAllFloorListByBuildingName(buildingName)

    res.json({
      success: true,
      message: '층 목록을 불러왔습니다.',
      value: floors
    })
  } catch (err) { /* empty */ }
}
export const getLockerList = async (req: Request, res: Response, next: NextFunction) => {
  const buildingName = req.query.buildingName as string
  const floor = Number(req.query.floor)

  if (!buildingName || isNaN(floor)) {
    res.status(400).json({ error: 'Invalid query parameters' })
    return
  }

  try {
    const lockers = await LockerService.getLockerList(buildingName, floor)

    res.json({
      success: true,
      message: '보관함 목록을 불러왔습니다.',
      value: lockers
    })
  } catch (err) {

  }
}

export const getAllLockerList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lockers = await LockerService.getAllLockerList()

    res.json({
      success: true,
      message: '보관함 목록을 불러왔습니다.',
      value: lockers
    })
  } catch (err) {

  }
}

export const getLockerDetail = async (req: Request, res: Response, next: NextFunction) => {
  const buildingName = req.query.buildingName as string
  const floor = Number(req.query.floor)
  const lockerNumber = Number(req.query.lockerNumber)

  if (!buildingName || isNaN(floor) || isNaN(lockerNumber)) {
    res.status(400).json({ error: 'Invalid query parameters' })
    return
  }

  try {
    const locker = await LockerService.getLockerDetail(buildingName, floor, lockerNumber)

    res.json({
      success: true,
      message: '보관함 정보를 불러왔습니다.',
      value: locker
    })
  } catch (err) {

  }
}

export const claimLocker = async (req: Request, res: Response, next: NextFunction) => {
  const buildingName = req.body.buildingName
  const floorNumber = req.body.floorNumber
  const lockerNumber = req.body.lockerNumber

  passport.authenticate('user', async (err, user: IUser, info) => {
    const objectId: Types.ObjectId = new Types.ObjectId(user._id)

    if (err || !buildingName || !floorNumber || !lockerNumber) {
      return res.status(400).json({ success: false, message: '오류가 발생했습니다.' })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    try {
      const locker_res = await LockerService.claimLocker(objectId, buildingName, floorNumber, lockerNumber)

      if (locker_res.success) {
        res.status(200).json(locker_res)
      } else {
        res.status(400).json(locker_res)
      }
    } catch (err) {
      res.status(500).json(err)
    }
  })(req, res, next)
}

export const shareLocker = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('user', async (err, user: IUser, info) => {
    const objectId: Types.ObjectId = new Types.ObjectId(user._id)
    const buildingName = req.body.buildingName
    const floorNumber = req.body.floorNumber
    const lockerNumber = req.body.lockerNumber
    const sharedWith = req.body.sharedWith

    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    try {
      const locker_res = await LockerService.shareLocker(objectId, buildingName, floorNumber, lockerNumber, sharedWith)

      if (locker_res.success) {
        res.status(200).json(locker_res)
      } else {
        res.status(400).json(locker_res)
      }
    } catch (err) {
      res.status(500).json(err)
    }
  })(req, res, next)
}

// 다른 사용자가 소유한 보관함에 대해 공유를 신청합니다.
// 신청 유저의 _id를 shareRequested 필드에 추가합니다.

export const requestLockerShare = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('user', async (err, user: IUser, info) => {
    const objectId: Types.ObjectId = new Types.ObjectId(user._id)
    const buildingName = req.body.buildingName
    const floorNumber = req.body.floorNumber
    const lockerNumber = req.body.lockerNumber

    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    try {
      const locker_res = await LockerService.requestLockerShare(objectId, buildingName, floorNumber, lockerNumber)

      if (locker_res.success) {
        res.status(200).json(locker_res)
      } else {
        res.status(400).json(locker_res)
      }
    } catch (err) {
      res.status(500).json(err)
    }
  })(req, res, next)
}

export const cancelLocker = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('user', async (err, user: IUser, info) => {
    const objectId: Types.ObjectId = new Types.ObjectId(user._id)
    const buildingName = req.body.buildingName
    const floorNumber = req.body.floorNumber
    const lockerNumber = req.body.lockerNumber
    const isOwner = req.body.isOwner

    if (err) {
      return res.status(400).json({ errors: err })
    }

    if (!info.success) {
      return res.status(400).json(info)
    }

    try {
      let locker_res = null;

      if (isOwner){
        locker_res = await LockerService.cancelClaimedLocker(objectId, buildingName, floorNumber, lockerNumber)
      }else {
        locker_res = await LockerService.cancelSharedLocker(objectId, buildingName, floorNumber, lockerNumber)
      }

      const httpCode = locker_res.success ? 200 : locker_res.httpCode ? locker_res.httpCode : 400

      res.status(httpCode).json(locker_res)
    } catch (err) {
      res.status(500).json(err)
    }
  })(req, res, next)
}
