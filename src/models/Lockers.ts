import mongoose, { type Model, Schema, type Types } from 'mongoose'

const { Types: { ObjectId } } = Schema // ObjectId 타입은 따로 꺼내주어야 한다.

export interface ILocker extends mongoose.Document {
  building: string
  floors: Floor[]
}

export interface Locker {
  lockerNumber: number
  claimedBy: Types.ObjectId | null
  sharedWith: Types.ObjectId[]
}

export interface Floor {
  floorNumber: number
  lockers: Locker[]
}

const LockerSchema = new mongoose.Schema({
  building: {
    type: String,
    required: true,
    unique: true
  },
  floors: [
    {
      floorNumber: {
        type: Number,
        required: true
      },
      lockers: [
        {
          lockerNumber: {
            type: Number,
            required: true
          },
          claimedBy: {
            type: ObjectId,
            ref: 'Users',
            default: null
          },
          sharedWith: {
            type: [ObjectId],
            ref: 'Users',
            default: []
          },
          status: {
            type: String,
            // Empty: 빈 사물함 (Claim 가능), Share_Available: 공유 가능, UnAvailable: 사용 불가, Maintenance: 수리 중
            enum: ['Empty', 'Share_Available', 'Unavailable', 'Maintenance'],
            default: 'Empty'
          }
        }
      ]
    }
  ]
}, { strict: false })

const Lockers: Model<ILocker> = mongoose.model<ILocker>('lockers', LockerSchema)

export default Lockers
