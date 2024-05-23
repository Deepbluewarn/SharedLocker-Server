import mongoose, { type Model, Schema, type Types } from 'mongoose'

const { Types: { ObjectId } } = Schema // ObjectId 타입은 따로 꺼내주어야 한다.

export interface IAdmins extends mongoose.Document {
    userId: Types.ObjectId
    role: string
    assignedLocker: Types.ObjectId
}

const AdminsSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true,
        unique: true,
        ref: 'users'
    },
    role: {
        type: String,
        required: true
    },
    assignedLocker: {
        type: ObjectId,
        ref: 'lockers'
    }
})

const Admins: Model<IAdmins> = mongoose.model<IAdmins>('admins', AdminsSchema)

export default Admins
