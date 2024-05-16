import mongoose, { type Model, Schema, type Types } from 'mongoose'

const { Types: { ObjectId } } = Schema // ObjectId 타입은 따로 꺼내주어야 한다.

export interface IRoles extends mongoose.Document {
    name: string
    role: string
}

const RolesSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    }
})

const Roles: Model<IRoles> = mongoose.model<IRoles>('roles', RolesSchema)

export default Roles
