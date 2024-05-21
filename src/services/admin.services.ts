import { Types } from "mongoose"
import Admins from "../models/Admins.js"
import { ILocker } from "../models/Lockers.js"

const findAdminByUserObjectId = async (userId: Types.ObjectId) => {
    return await Admins.findOne({ userId })
}

const findAdminWithAssignedLocker = async (userId: Types.ObjectId) => {
    return await (Admins.findOne({ userId }).populate<{ assignedLocker: ILocker}>('assignedLocker'))
}

const createAdmin = async (userId: string, role: string, assignedLocker?: string) => {
    return await Admins.insertMany({ userId, role, assignedLocker })
}

export default {
    findAdminByUserObjectId,
    findAdminWithAssignedLocker,
    createAdmin,
}
