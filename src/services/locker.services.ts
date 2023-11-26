import { Types } from "mongoose";
import Lockers from "../models/Lockers.js";
import Users from "../models/Users.js";

const getAllBuildingList = async () => {
    return await Lockers.distinct('building');
}

const getAllFloorListByBuildingName = async (buildingName: string) => {
    console.log('locker.service getAllFloorListByBuildingName buildingName: ', buildingName);

    const floorsInBuilding = await Lockers.aggregate([
        { $match: { building: buildingName } }, // 특정 빌딩에 해당하는 문서 선택
        { $unwind: '$floors' }, // 배열인 floors 필드를 풀어줌
        { $group: { _id: '$floors.floorNumber' } }, // floorNumber로 그룹화
        { $project: { _id: 0, floorNumber: '$_id' } }, // _id 필드 제거 및 필드 이름 변경
    ]);

    return floorsInBuilding.map(floor => floor.floorNumber);
}

const getLockerList = async (buildingName: string, floorNumber: number) => {
    const lockerList = await Lockers.aggregate([
        { $match: { building: buildingName } }, // 특정 빌딩에 해당하는 문서 선택
        { $unwind: '$floors' }, // 배열인 floors 필드를 풀어줌
        { $match: { 'floors.floorNumber': floorNumber } }, // 특정 층에 해당하는 문서 선택
        { $unwind: '$floors.lockers' }, // 배열인 lockers 필드를 풀어줌
        { $group: { _id: '$floors.lockers.lockerNumber' } }, // lockerNumber로 그룹화
        { $project: { _id: 0, lockerNumber: '$_id' } }, // _id 필드 제거 및 필드 이름 변경
    ]);

    return lockerList.map(locker => locker.lockerNumber);
}

/**
 * 
 * @param user_id 보관함을 소유한 유저의 _id
 * @returns 보관함 배열
 */
const getUserLockerList = async (user_id: Types.ObjectId) => {
    return await Lockers.aggregate([
        { $unwind: '$floors' },
        { $unwind: '$floors.lockers' },
        { $match: { 'floors.lockers.claimedBy': user_id } },
        { $project: { 
            _id: 0, 
            building: 1, 
            floorNumber: '$floors.floorNumber', 
            lockerNumber: '$floors.lockers.lockerNumber',
            sharedWith: '$floors.lockers.sharedWith'
        }}
    ]);
}

// 유저가 공유받은 보관함 목록을 가져옵니다.
const getUserSharedLockerList = async (user_id: Types.ObjectId) => {
    return await Lockers.aggregate([
        { $unwind: '$floors' },
        { $unwind: '$floors.lockers' },
        { $match: { 'floors.lockers.sharedWith': user_id } },
        { $project: { 
            _id: 0, 
            building: 1, 
            floorNumber: '$floors.floorNumber', 
            lockerNumber: '$floors.lockers.lockerNumber',
            claimedBy: '$floors.lockers.claimedBy'
        }}
    ]);

}

/**
 * 
 * @param user_id 보관함을 소유한 유저의 _id
 * @returns 소유자 닉네임과 공유자 닉네임이 포함된 보관함 배열
 */
const getUserLockerWithShareUserList = async (user_id: Types.ObjectId) => {
    return await Lockers.aggregate([
        { $unwind: '$floors' },
        { $unwind: '$floors.lockers' },
        { $match: { 'floors.lockers.claimedBy': user_id } },
        {
            $lookup: {
                from: 'users',
                localField: 'floors.lockers.claimedBy',
                foreignField: '_id',
                as: 'claimedByUser'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'floors.lockers.sharedWith',
                foreignField: '_id',
                as: 'sharedWithUsers'
            }
        },
        { 
            $project: { 
                _id: 0, 
                building: 1,
                floorNumber: '$floors.floorNumber',
                lockerNumber: '$floors.lockers.lockerNumber',
                claimedBy: { 
                    $arrayElemAt: [
                        {
                            $map: {
                                input: '$claimedByUser',
                                as: 'user',
                                in: {
                                    username: '$$user.userId',
                                }
                            }
                        }, 
                        0
                    ]
                },
                sharedWith: {
                    $map: {
                        input: '$sharedWithUsers',
                        as: 'user',
                        in: {
                            username: '$$user.userId',
                        }
                    }
                }
            } 
        }
    ]);
}

/**
 * 
 * @param user_id 보관함을 소유한 유저의 _id
 * @returns 소유자 닉네임과 공유자 닉네임이 포함된 보관함 배열
 */
const getUserSharedLockerWithShareUserList = async (user_id: Types.ObjectId) => {
    return await Lockers.aggregate([
        { $unwind: '$floors' },
        { $unwind: '$floors.lockers' },
        { $match: { 'floors.lockers.sharedWith': user_id } },
        {
            $lookup: {
                from: 'users',
                localField: 'floors.lockers.claimedBy',
                foreignField: '_id',
                as: 'claimedByUser'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'floors.lockers.sharedWith',
                foreignField: '_id',
                as: 'sharedWithUsers'
            }
        },
        { 
            $project: { 
                _id: 0, 
                building: 1,
                floorNumber: '$floors.floorNumber',
                lockerNumber: '$floors.lockers.lockerNumber',
                claimedBy: { 
                    $arrayElemAt: [
                        {
                            $map: {
                                input: '$claimedByUser',
                                as: 'user',
                                in: {
                                    username: '$$user.userId',
                                }
                            }
                        }, 
                        0
                    ]
                },
                sharedWith: {
                    $map: {
                        input: '$sharedWithUsers',
                        as: 'user',
                        in: {
                            username: '$$user.userId',
                        }
                    }
                }
            } 
        }
    ]);
}

const claimLocker = async (user_id: Types.ObjectId, buildingName: string, floorNumber: number, lockerNumber: number) => {
    console.log('[updateLocker] user_id: ', user_id)
    console.log('[updateLocker] buildingName: ', buildingName)
    console.log('[updateLocker] floorNumber: ', floorNumber)
    console.log('[updateLocker] lockerNumber: ', lockerNumber)

    // 첫 번째 호출에서 원본 문서를 가져옵니다.
    const originalLocker = await Lockers.findOne(
        {
            building: buildingName,
            floors: {
                $elemMatch: {
                    floorNumber: floorNumber,
                    lockers: {
                        $elemMatch: {
                            lockerNumber: lockerNumber,
                            claimedBy: null
                        }
                    }
                }
            }
        }
    );

    // 원본 문서가 없거나 claimedBy 필드가 null이 아니라면 에러를 발생시킵니다.
    if (!originalLocker) {
        return { success: false, message: "이미 사용중인 보관함입니다." };
    }

    // 두 번째 호출에서 문서를 업데이트합니다.
    await Lockers.findOneAndUpdate(
        { building: buildingName },
        { $set: { "floors.$[i].lockers.$[j].claimedBy": user_id } },
        {
            arrayFilters: [
                { "i.floorNumber": floorNumber },
                { "j.lockerNumber": lockerNumber, "j.claimedBy": null }
            ],
            new: true,
        }
    );

    return { success: true, message: "보관함이 성공적으로 등록되었습니다.", locker: {
        building: buildingName,
        floorNumber: Number(floorNumber),
        lockerNumber: Number(lockerNumber)
    } };
}

/**
 * 
 * @param user_id 
 * @param buildingName 
 * @param floorNumber 
 * @param lockerNumber 
 * @param sharedWith 추가하고자 하는 유저의 아이디
 */
const shareLocker = async (user_id: Types.ObjectId, buildingName: string, floorNumber: number, lockerNumber: number, sharedWith: string) => {
    // user_id 가 소유한 보관함 목록을 가져옵니다.
    // 그리고 buildingName, floorNumber, lockerNumber가 일치하는 보관함을 찾습니다.
    // 만약 해당 조건에 맞는 보관함이 있으면 해당 보관함에 sharedWith를 추가합니다.
    // sharedWith 를 추가하기 전 해당 아이디의 유저가 존재하는지 확인합니다.
    // 만약 유저가 존재하지 않는다면 에러를 발생시킵니다. (존재하지 않는 유저입니다.)

    console.log('[shareLocker] user_id: ', user_id);
    console.log('[shareLocker] buildingName: ', buildingName);
    console.log('[shareLocker] floorNumber: ', floorNumber);
    console.log('[shareLocker] lockerNumber: ', lockerNumber);
    console.log('[shareLocker] sharedWith: ', sharedWith);

    const userLockerList = await getUserLockerList(user_id);

    console.log('[shareLocker] userLockerList: ', userLockerList);

    const locker = userLockerList.find(
        locker => 
            locker.building === buildingName && 
            Number(locker.floorNumber) === Number(floorNumber) && 
            Number(locker.lockerNumber) === Number(lockerNumber)
    );

    console.log('[shareLocker] locker: ', locker);

    if(!locker){
        return { success: false, message: "해당 보관함을 찾을 수 없거나 등록되어 있지 않은 보관함입니다." };
    }

    const sharedWithUser = await Users.findOne({ userId: sharedWith });

    if(!sharedWithUser){
        return { success: false, message: "존재하지 않는 유저입니다." };
    }
    if(user_id.equals(sharedWithUser._id)){
        return { success: false, message: "자신에게 보관함을 공유할 수 없습니다." };
    }

    console.log('[shareLocker] sharedWithUser: ', sharedWithUser);
    console.log('[shareLocker] sharedWithUser._id: ', sharedWithUser._id);

    const sharedWithUserId = new Types.ObjectId(sharedWithUser._id);

    locker.sharedWith.forEach(sharedWith => {
        console.log('[shareLocker] 중복 확인 sharedWith: ', sharedWith);
        console.log('[shareLocker] 중복 확인 sharedWithUserId: ', sharedWithUserId);
        if(sharedWithUserId.equals(sharedWith)){
            return { success: false, message: "이미 공유된 유저입니다." };
        }
    });

    const addSharedWithUser = await Lockers.findOneAndUpdate(
        { building: buildingName },
        {
            $addToSet: {
                "floors.$[i].lockers.$[j].sharedWith": sharedWithUserId
            }
        },
        {
            arrayFilters: [
                { "i.floorNumber": floorNumber },
                { "j.lockerNumber": lockerNumber }
            ],
        }
    );

    return { success: true, message: "보관함이 성공적으로 공유되었습니다." };
}

const checkLockerAccessByUserId = async (user_id: Types.ObjectId, buildingName: string, floorNumber: number, lockerNumber: number) => {
    const [claimedLockers, sharedLockers] = await Promise.all([
        getUserLockerList(user_id),
        getUserSharedLockerList(user_id)
    ]);

    const allLockers = [...claimedLockers, ...sharedLockers];

    const locker = allLockers.find(
        locker => 
            locker.building === buildingName && 
            Number(locker.floorNumber) === Number(floorNumber) && 
            Number(locker.lockerNumber) === Number(lockerNumber)
    );

    if(!locker){
        return { success: false, message: "해당 보관함을 찾을 수 없거나 등록되어 있지 않은 보관함입니다." };
    }

    return { success: true, message: "보관함에 접근할 수 있습니다.", locker: {
        buildingName: locker.building,
        floorNumber: Number(locker.floorNumber),
        lockerNumber: Number(locker.lockerNumber)
    }};
}

export default {
    getAllBuildingList,
    getAllFloorListByBuildingName,
    getLockerList,
    getUserLockerList,
    getUserSharedLockerWithShareUserList,
    getUserLockerWithShareUserList,
    claimLocker,
    shareLocker,
    checkLockerAccessByUserId
};