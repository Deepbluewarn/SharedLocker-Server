import mongoose, { Model, Schema, Types } from 'mongoose';

const { Types: { ObjectId } } = Schema; // ObjectId 타입은 따로 꺼내주어야 한다.

export interface ILocker extends mongoose.Document {
    building: string;
    floors: Floor[];
}

export interface Locker {
    lockerNumber: number;
    claimedBy: Types.ObjectId | null;
    sharedWith: Types.ObjectId[];
}

export interface Floor {
    floorNumber: number;
    lockers: Locker[];
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
                required: true,
            },
            lockers: [
                {
                    lockerNumber: {
                        type: Number,
                        required: true,
                    },
                    claimedBy: {
                        type: ObjectId,
                        ref: 'Users',
                        default: null
                    },
                    sharedWith: [
                        {
                            type: ObjectId,
                            ref: 'Users',
                            default: null
                        }
                    ]
                }
            ]
        }
    ]
}, {strict: false});

const Lockers: Model<ILocker> = mongoose.model<ILocker>('lockers', LockerSchema);


export default Lockers;