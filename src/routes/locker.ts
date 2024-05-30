import { cancelLocker, claimLocker, createLocker, deleteLocker, getAllBuildingList, getAllFloorByBuildingNumber, getAllLockerList, getLockerDetail, getLockerList, getLockerStructure, requestLockerShare, shareLocker } from '../controller/locker.controller.js'
import express from 'express'

const lockerRouter = express.Router()

lockerRouter.get('/locker/building', getAllBuildingList)
lockerRouter.get('/locker/floor', getAllFloorByBuildingNumber)
lockerRouter.get('/lockers', getLockerList)
lockerRouter.get('/locker/all', getAllLockerList)
lockerRouter.get('/locker', getLockerDetail)
lockerRouter.get('/locker/structure', getLockerStructure)
lockerRouter.post('/locker', claimLocker)
lockerRouter.post('/locker/create', createLocker)

// 공유자 추가
lockerRouter.post('/locker/share', shareLocker)
lockerRouter.post('/locker/request-share', requestLockerShare)
lockerRouter.post('/locker/cancel', cancelLocker)
lockerRouter.delete('/locker', deleteLocker)

export default lockerRouter
