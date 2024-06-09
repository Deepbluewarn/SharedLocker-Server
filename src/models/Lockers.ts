import mongoose, { type Model, Schema, type Types } from 'mongoose'

const { Types: { ObjectId } } = Schema // ObjectId 타입은 따로 꺼내주어야 한다.

export interface ILocker extends mongoose.Document {
  buildingName: string,
  buildingNumber: number,
  floors: Floor[]
}

export interface Locker {
  lockerNumber: number
  claimedBy: Types.ObjectId | null
  sharedWith: Types.ObjectId[]
  shareRequested: Types.ObjectId[]
  status: 'Empty' | 'Share_Available' | 'Unavailable' | 'Maintenance',
  accessHistory: LockerAccess[]
}

export interface Floor {
  floorNumber: number
  lockers: Locker[]
}

export interface LockerAccess {
  userId: String | null
  accessTime: Date | null
  accessType: 'owner' | 'shared' | null
}

const LockerAccessSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: null
  },
  accessTime: {
    type: Date,
    default: Date.now
  },
  accessType: {
    type: String,
    enum: ['owner', 'shared'],
    default: null
  }
})

const LockerSchema = new mongoose.Schema({
  buildingNumber: {
    type: Number,
    required: true,
    unique: true
  },
  buildingName: {
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
            ref: 'users',
            default: null
          },
          sharedWith: {
            type: [ObjectId],
            ref: 'users',
            default: []
          },
          shareRequested: {
            type: [ObjectId],
            ref: 'users',
            default: []
          },
          status: {
            type: String,
            // Empty: 빈 사물함 (Claim 가능), Share_Available: 공유 가능, UnAvailable: 사용 불가, Maintenance: 수리 중
            enum: ['Empty', 'Share_Available', 'Unavailable', 'Maintenance'],
            default: 'Empty'
          },
          accessHistory: {
            type: [LockerAccessSchema],
            default: []
          }
        }
      ]
    }
  ]
}, { strict: false })

const Lockers: Model<ILocker> = mongoose.model<ILocker>('lockers', LockerSchema)

export default Lockers
