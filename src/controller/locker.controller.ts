import { NextFunction, Response, Request } from "express";
import LockerService from "../services/locker.services.js";
import passport from "../services/passport/setup.js";
import { Types } from "mongoose";
import { IUser } from "../models/Users.js";

export const getAllBuildingList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // MongoDB의 distinct를 사용하여 중복되지 않는 건물 목록을 가져옴
        const buildings = await LockerService.getAllBuildingList();

        res.json(buildings);
    } catch (error) {

    }
}

export const getAllFloorByBuildingName = async (req: Request, res: Response, next: NextFunction) => {
    const buildingName = req.query.buildingName as string;

    if(!buildingName) {
        res.status(400).json({ error: 'Invalid query parameters' });
        return;
    }

    try{
        const floors = await LockerService.getAllFloorListByBuildingName(buildingName);

        res.json(floors);
    }catch(err){

    }
}
export const getLockerList = async (req: Request, res: Response, next: NextFunction) => {
    const buildingName = req.query.buildingName as string;
    const floor = Number(req.query.floor);

    if(!buildingName || isNaN(floor)) {
        res.status(400).json({ error: 'Invalid query parameters' });
        return;
    }

    try{
        const lockers = await LockerService.getLockerList(buildingName, floor);

        res.json(lockers);
    }catch(err){

    }
}

export const claimLocker = async (req: Request, res: Response, next: NextFunction) => {
    const buildingName = req.body.buildingName;
    const floorNumber = req.body.floorNumber;
    const lockerNumber = req.body.lockerNumber;

    passport.authenticate('user', async (err, user: IUser, info) => {
        const objectId: Types.ObjectId = new Types.ObjectId(user._id);

        if (err || !buildingName || !floorNumber || !lockerNumber) {
            return res.status(400).json({success: false, message: '오류가 발생했습니다.'});
        }

        if(!info.success){
            return res.status(400).json(info);
        }

        try{
            const locker_res = await LockerService.claimLocker(objectId, buildingName, floorNumber, lockerNumber);

            if(locker_res.success){
                res.status(200).json(locker_res);
            }else{
                res.status(400).json(locker_res);
            }
        }catch(err){
            res.status(500).json(err);
        }
        
    })(req, res, next);
}

export const shareLocker = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('user', async (err, user: IUser, info) => {
        const objectId: Types.ObjectId = new Types.ObjectId(user._id);
        const buildingName = req.body.buildingName;
        const floorNumber = req.body.floorNumber;
        const lockerNumber = req.body.lockerNumber;
        const sharedWith = req.body.sharedWith;

        if (err) {
            return res.status(400).json({ errors: err });
        }

        if(!info.success){
            return res.status(400).json(info);
        }

        try{
            const locker_res = await LockerService.shareLocker(objectId, buildingName, floorNumber, lockerNumber, sharedWith);

            if(locker_res.success){
                res.status(200).json(locker_res);
            }else{
                res.status(400).json(locker_res);
            }
        }catch(err){
            res.status(500).json(err);
        }
    })(req, res, next);
}