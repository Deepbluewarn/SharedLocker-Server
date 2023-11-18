import passport from "passport";
import { IUser } from "../models/Users.js";
import { Types } from "mongoose";
import LockerService from "../services/locker.services.js";

export const getUsersLocker = async (req, res, next) => {
    passport.authenticate('user', async (err, user: IUser, info) => {
        const objectId: Types.ObjectId = new Types.ObjectId(user._id);

        const locker = await LockerService.getUserLockerList(objectId);

        if (!locker || locker.length === 0) {
            console.log('[getUsersLocker] locker is null');
            return res.status(400).json({ success: false, message: "사용중인 보관함이 없습니다." });
        }
        else {
            console.log('[getUsersLocker] locker: ', locker);
            return res.status(200).json({ success: true, message: "사용중인 보관함이 있습니다.", locker: locker });
        }
    })(req, res, next);
}