import mongoose, { Model, ObjectId, Schema } from 'mongoose';
import Users from './Users';

const { Types: { ObjectId } } = Schema; // ObjectId 타입은 따로 꺼내주어야 한다.

export interface ILocker extends mongoose.Document {
    _id: string;
    building: string;
    floors: {
        floorNumber: number;
        lockers: {
            lockerNumber: number;
            claimedBy: ObjectId;
        }[];
    }[];
}

const LockerSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    building: {
        type: String,
        required: true,
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
                        ref: Users
                    }
                }
            ]
        }
    ]
}, {strict: false});

const Lockers: Model<ILocker> = mongoose.model<ILocker>('lockers', LockerSchema);


export default Lockers;