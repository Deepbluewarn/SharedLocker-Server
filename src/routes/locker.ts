import { claimLocker, getAllBuildingList, getAllFloorByBuildingName, getLockerList, shareLocker } from '../controller/locker.controller.js';
import express from 'express';

const lockerRouter = express.Router();

lockerRouter.get("/locker/building", getAllBuildingList);
lockerRouter.get("/locker/floor", getAllFloorByBuildingName);
lockerRouter.get("/lockers", getLockerList);
lockerRouter.post("/lockers", claimLocker);

// 공유자 추가
lockerRouter.post("/lockers/share", shareLocker);

export default lockerRouter;