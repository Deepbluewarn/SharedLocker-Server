import mongoose, { type Model } from 'mongoose'

export interface IUser extends mongoose.Document {
  userId: string
  name: string
  email: string
  password: string
  createdAt: Date
  refreshToken?: string
}

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    require: true
  },
  name: {
    type: String
  },
  email: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  refreshToken: {
    type: String
  }
}, { strict: false })

const Users: Model<IUser> = mongoose.model<IUser>('users', UserSchema)

export default Users
