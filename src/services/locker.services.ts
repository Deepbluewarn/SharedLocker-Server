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
    console.log('locker.service getLockerList buildingName: ', buildingName);
    console.log('locker.service getLockerList floorNumber: ', floorNumber);

    const building = await Lockers.findOne({ building: buildingName });
    const floor = building.floors.find(floor => floor.floorNumber === floorNumber);

    return floor.lockers;
}

const getUserLockerList = async (user_id: Types.ObjectId) => {
    return await Lockers.aggregate([
        { $unwind: '$floors' },
        { $unwind: '$floors.lockers' },
        { $match: { 'floors.lockers.claimedBy': user_id } },
        { $project: { _id: 0, building: 1, floorNumber: '$floors.floorNumber', lockerNumber: '$floors.lockers.lockerNumber' } }
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
    const updatedLocker = await Lockers.findOneAndUpdate(
        { building: buildingName },
        { $set: { "floors.$[i].lockers.$[j].claimedBy": user_id } },
        {
            arrayFilters: [
                { "i.floorNumber": floorNumber },
                { "j.lockerNumber": lockerNumber, "j.claimedBy": null }
            ],
            new: true
        }
    );

    return { success: true, message: "보관함이 성공적으로 등록되었습니다.", locker: updatedLocker };
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

    console.log('[shareLocker] sharedWithUser: ', sharedWithUser);
    console.log('[shareLocker] sharedWithUser._id: ', sharedWithUser._id);

    const sharedWithUserId = new Types.ObjectId(sharedWithUser._id);

    const addSharedWithUser = await Lockers.findOneAndUpdate(
        { building: buildingName },
        { $addToSet: { "floors.$[i].lockers.$[j].sharedWith": sharedWithUser._id } },
        {
            arrayFilters: [
                { "i.floorNumber": floorNumber },
                { "j.lockerNumber": lockerNumber, "j.claimedBy": user_id }
            ],
            new: true
        }
    );

    return { success: true, message: "보관함이 성공적으로 공유되었습니다.", locker: addSharedWithUser };
}

export default {
    getAllBuildingList,
    getAllFloorListByBuildingName,
    getLockerList,
    getUserLockerList,
    claimLocker,
    shareLocker
};