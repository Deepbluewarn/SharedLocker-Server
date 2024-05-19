import { cancelLocker, claimLocker, getAllBuildingList, getAllFloorByBuildingName, getAllLockerList, getLockerDetail, getLockerList, requestLockerShare, shareLocker } from '../controller/locker.controller.js'
import express from 'express'

const lockerRouter = express.Router()

lockerRouter.get('/locker/building', getAllBuildingList)
lockerRouter.get('/locker/floor', getAllFloorByBuildingName)
lockerRouter.get('/lockers', getLockerList)
lockerRouter.get('/all-lockers', getAllLockerList)
lockerRouter.get('/locker', getLockerDetail)
lockerRouter.post('/locker', claimLocker)

// 공유자 추가
lockerRouter.post('/locker/share', shareLocker)
lockerRouter.post('/locker/request-share', requestLockerShare)
lockerRouter.delete('/locker/cancel', cancelLocker)

export default lockerRouter
