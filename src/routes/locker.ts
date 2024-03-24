import { claimLocker, getAllBuildingList, getAllFloorByBuildingName, getLockerList, shareLocker } from '../controller/locker.controller.js'
import express from 'express'

const lockerRouter = express.Router()

lockerRouter.get('/locker/building', getAllBuildingList)
lockerRouter.get('/locker/floor', getAllFloorByBuildingName)
lockerRouter.get('/lockers', getLockerList)
lockerRouter.post('/locker', claimLocker)

// 공유자 추가
lockerRouter.post('/locker/share', shareLocker)

export default lockerRouter
