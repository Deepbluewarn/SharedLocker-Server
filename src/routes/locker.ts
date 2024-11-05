import { analyzeLockerPicture, cancelLocker, claimLocker, createLocker, deleteLocker, getAllBuildingList, getAllFloorByBuildingNumber, getAllLockerList, getLockerDetail, getLockerList, getLockerStructure, getStoredItems, requestLockerShare, shareLocker } from '../controller/locker.controller.js'
import express from 'express'
import { authenticateApiKey } from '../middlewares/auth.js'

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

// 보관 물품 이미지 인식
lockerRouter.post('/locker/analyze', authenticateApiKey, analyzeLockerPicture);
lockerRouter.get('/locker/items', getStoredItems);

export default lockerRouter
