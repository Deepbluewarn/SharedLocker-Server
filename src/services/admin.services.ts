import Admins from "../models/Admins.js"

const findAdminByObjectId = async (userId: string) => {
    return await Admins.findOne({ userId })
}

const createAdmin = async (userId: string, role: string, assignedLocker?: string) => {
    return await Admins.insertMany({ userId, role, assignedLocker })
}

export default {
    findAdminByObjectId,
    createAdmin,
}
