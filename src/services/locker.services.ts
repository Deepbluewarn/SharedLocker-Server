import { Types } from 'mongoose'
import Lockers, { Locker } from '../models/Lockers.js'
import Users, { IUser } from '../models/Users.js'
import { IServiceMessage } from '../interfaces/index.js'
import adminServices from './admin.services.js'

const USERS_MASK = {
  __v: 0,
  refresh_token: 0
}

const lookupForClaimedBy = (mask: boolean) => {
  return {
    $lookup: {
      from: 'users',
      localField: 'floors.lockers.claimedBy',
      pipeline: mask ? [] : [
        {
          $project: USERS_MASK
        }
      ],
      foreignField: '_id',
      as: 'claimedByUser'
    }
  }
}

const lookupForSharedWith = (mask: boolean) => {
  return {
    $lookup: {
      from: 'users',
      localField: 'floors.lockers.sharedWith',
      pipeline: mask ? [] : [
        {
          $project: USERS_MASK
        }
      ],
      foreignField: '_id',
      as: 'sharedWithUsers'
    }
  }
}

const lookupForShareRequested = (mask: boolean) => {
  return {
    $lookup: {
      from: 'users',
      localField: 'floors.lockers.shareRequested',
      pipeline: mask ? [] : [
        {
          $project: USERS_MASK
        }
      ],
      foreignField: '_id',
      as: 'shareRequestedUsers'
    }
  }
}

const getAllBuildingList = async () => {
  return await Lockers.find({}, { floors: 0, _id: 0, __v: 0 })
}

const getAllFloorListByBuildingNumber = async (buildingNumber: number) => {
  console.log('locker.service getAllFloorListByBuildingNumber buildingNumber: ', buildingNumber)

  const floorsInBuilding = await Lockers.aggregate([
    { $match: { buildingNumber } }, // 특정 빌딩에 해당하는 문서 선택
    { $unwind: '$floors' }, // 배열인 floors 필드를 풀어줌
    { $group: { _id: '$floors.floorNumber' } }, // floorNumber로 그룹화
    { $project: { _id: 0, floorNumber: '$_id' } } // _id 필드 제거 및 필드 이름 변경
  ])

  return floorsInBuilding.map(floor => floor.floorNumber)
}

const getLockerList = async (buildingNumber: number, floorNumber: number) => {
  const lockerList = await Lockers.aggregate([
    { $match: { buildingNumber } }, // 특정 빌딩에 해당하는 문서 선택
    { $unwind: '$floors' }, // 배열인 floors 필드를 풀어줌
    { $match: { 'floors.floorNumber': Number(floorNumber) } }, // 특정 층에 해당하는 문서 선택
    { $unwind: '$floors.lockers' }, // 배열인 lockers 필드를 풀어줌
    { $group: { _id: '$floors.lockers.lockerNumber', status: {$first: '$floors.lockers.status'} }}, // lockerNumber로 그룹화
    { $project: { _id: 0, lockerNumber: '$_id', status: 1} } // _id 필드 제거 및 필드 이름 변경
  ])

  return lockerList;
}

const getAllLockerList = async () => {
  return await Lockers.aggregate([
    { $unwind: '$floors' },
    { $unwind: '$floors.lockers' },
    {
      $project: {
        _id: 0,
        buildingName: 1,
        buildingNumber: 1,
        floorNumber: '$floors.floorNumber',
        lockerNumber: '$floors.lockers.lockerNumber',
        status: '$floors.lockers.status'
      }
    }
  ])
}

const getLockerDetail = async (buildingNumber: number, floorNumber: number, lockerNumber: number, includeMetadata: boolean) => {
  buildingNumber = Number(buildingNumber)
  floorNumber = Number(floorNumber)
  lockerNumber = Number(lockerNumber)

  return await Lockers.aggregate([
    { $match: { buildingNumber } },
    { $unwind: '$floors' },
    { $match: { 'floors.floorNumber': floorNumber } },
    { $unwind: '$floors.lockers' },
    { $match: { 'floors.lockers.lockerNumber': lockerNumber } },
    lookupForClaimedBy(includeMetadata),
    lookupForSharedWith(includeMetadata),
    lookupForShareRequested(includeMetadata),
    {
      $project: {
        _id: 0,
        buildingName: 1,
        buildingNumber: 1,
        floorNumber: '$floors.floorNumber',
        lockerNumber: '$floors.lockers.lockerNumber',
        status: '$floors.lockers.status',
        claimedByUser: 1,
        sharedWithUsers: 1,
        shareRequestedUsers: 1,
        accessHistory: '$floors.lockers.accessHistory',
      }
    },
  ])
}

/**
 * 전체 보관함 구조를 조회합니다.
 */

const getLockerStructure = async () => {
  return await Lockers.aggregate([
    {
      $unwind: {
        path: '$floors',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$_id',
        buildingNumber: {
          $first: '$buildingNumber'
        },
        buildingName: {
          $first: '$buildingName'
        },
        floorList: {
          $push: '$floors.floorNumber'
        },
        lockerList: {
          $push: {
            floor: '$floors.floorNumber',
            list: '$floors.lockers.lockerNumber'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
      }
    }
  ])
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
    {
      $project: {
        _id: 0,
        buildingName: 1,
        buildingNumber: 1,
        floorNumber: '$floors.floorNumber',
        lockerNumber: '$floors.lockers.lockerNumber',
        sharedWith: '$floors.lockers.sharedWith'
      }
    }
  ])
}

// 유저가 공유받은 보관함 목록을 가져옵니다.
const getUserSharedLockerList = async (user_id: Types.ObjectId) => {
  return await Lockers.aggregate([
    { $unwind: '$floors' },
    { $unwind: '$floors.lockers' },
    { $match: { 'floors.lockers.sharedWith': user_id } },
    {
      $project: {
        _id: 0,
        buildingName: 1,
        buildingNumber: 1,
        floorNumber: '$floors.floorNumber',
        lockerNumber: '$floors.lockers.lockerNumber',
        claimedBy: '$floors.lockers.claimedBy'
      }
    }
  ])
}

/**
 *
 * @param user_id 보관함을 소유한 유저의 _id
 * @returns 소유자 닉네임과 공유자 닉네임이 포함된 보관함 배열
 */
const getUserLockerWithShareUserList = async (user_id: Types.ObjectId, includeMetadata: boolean) => {
  return await Lockers.aggregate([
    { $unwind: '$floors' },
    { $unwind: '$floors.lockers' },
    { $match: { 'floors.lockers.claimedBy': user_id } },
    lookupForClaimedBy(includeMetadata),
    lookupForSharedWith(includeMetadata),
    lookupForShareRequested(includeMetadata),
    {
      $project: {
        _id: 0,
        buildingName: 1,
        buildingNumber: 1,
        floorNumber: '$floors.floorNumber',
        lockerNumber: '$floors.lockers.lockerNumber',
        claimedByUser: 1,
        sharedWithUsers: 1,
        shareRequestedUsers: 1,
        owned: {
          $cond: {
            if: { $eq: ['$floors.lockers.claimedBy', user_id] },
            then: true,
            else: false
          }
        }
      }
    }
  ])
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
      $lookup: {
        from: 'users',
        localField: 'floors.lockers.shareRequested',
        foreignField: '_id',
        as: 'shareRequestedUsers'
      }
    },
    {
      $project: {
        _id: 0,
        buildingName: 1,
        buildingNumber: 1,
        floorNumber: '$floors.floorNumber',
        lockerNumber: '$floors.lockers.lockerNumber',
        claimedBy: {
          $arrayElemAt: [
            {
              $map: {
                input: '$claimedByUser',
                as: 'user',
                in: {
                  nickname: '$$user.userId'
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
              nickname: '$$user.userId'
            }
          }
        },
        shareRequested: {
          $map: {
            input: '$shareRequestedUsers',
            as: 'user',
            in: {
              nickname: '$$user.userId'
            }
          }
        },
        owned: {
          $cond: {
            if: { $eq: ['$floors.lockers.claimedBy', user_id] },
            then: true,
            else: false
          }
        }
      }
    }
  ])
}

const claimLocker = async (user_id: Types.ObjectId, buildingNumber: number, floorNumber: number, lockerNumber: number) : Promise<IServiceMessage> => {
  console.log('[updateLocker] user_id: ', user_id)
  console.log('[updateLocker] buildingNumber: ', buildingNumber)
  console.log('[updateLocker] floorNumber: ', floorNumber)
  console.log('[updateLocker] lockerNumber: ', lockerNumber)

  const userClaimedLocker = await Lockers.findOne({
    'floors.lockers.claimedBy': user_id
  });

  if (userClaimedLocker) {
    return { success: false, message: '이미 보관함을 소유하고 있습니다. 보관함은 회원 당 하나만 소유할 수 있습니다.' }
  }

  // 첫 번째 호출에서 원본 문서를 가져옵니다.
  const originalLocker = await Lockers.findOne(
    {
      buildingNumber: buildingNumber,
      floors: {
        $elemMatch: {
          floorNumber,
          lockers: {
            $elemMatch: {
              lockerNumber,
              claimedBy: null
            }
          }
        }
      }
    }
  )

  // 원본 문서가 없거나 claimedBy 필드가 null이 아니라면 에러를 발생시킵니다.
  if (!originalLocker) {
    return { success: false, message: '이미 사용중이거나 존재하지 않는 보관함입니다.' }
  }

  if (originalLocker.floors[0].lockers[0].claimedBy === user_id) {
    return { success: false, message: '이미 소유중인 보관함입니다.' }
  }

  // 두 번째 호출에서 문서를 업데이트합니다.
  await Lockers.findOneAndUpdate(
    { buildingNumber: buildingNumber },
    { 
      $set: { 
        'floors.$[i].lockers.$[j].claimedBy': user_id, 
        'floors.$[i].lockers.$[j].status': 'Share_Available'
      }
    },
    {
      arrayFilters: [
        { 'i.floorNumber': floorNumber },
        { 'j.lockerNumber': lockerNumber, 'j.claimedBy': null }
      ],
      new: true
    }
  )

  return {
    success: true,
    message: '보관함이 성공적으로 등록되었습니다.',
    value: {
      buildingName: originalLocker.buildingName,
      floorNumber: Number(floorNumber),
      lockerNumber: Number(lockerNumber)
    }
  }
}

const createLocker = async (buildingNumber: number, floorNumber: number, lockerNumber: number) : Promise<IServiceMessage> => {
  const locker = await Lockers.findOne({
    buildingNumber,
    floors: {
      $elemMatch: {
        floorNumber,
        lockers: {
          $elemMatch: {
            lockerNumber
          }
        }
      }
    }
  })

  if (locker) {
    return { success: false, message: '이미 존재하는 보관함입니다.' }
  }

  const newLocker: Locker = {
    lockerNumber: lockerNumber,
    claimedBy: null,
    sharedWith: [],
    shareRequested: [],
    status: 'Empty',
    accessHistory: []
  }

  const update_res = await Lockers.findOneAndUpdate(
    { 
      buildingNumber: buildingNumber,
    },
    {
      $push: {
        'floors.$[i].lockers': newLocker
      }
    },
    {
      arrayFilters: [
        { 'i.floorNumber': floorNumber }
      ],
      upsert: true
    },
  )

  if (!update_res) {
    return { success: false, message: '보관함을 추가하는데 실패했습니다.' }
  }

  return { success: true, message: `${lockerNumber}번 보관함이 성공적으로 등록되었습니다.` }
}

/**
 *
 * @param user_id
 * @param buildingNumber
 * @param floorNumber
 * @param lockerNumber
 * @param sharedWith 추가하고자 하는 유저의 아이디
 */
const shareLocker = async (user_id: Types.ObjectId, buildingNumber: number, floorNumber: number, lockerNumber: number, sharedWith: string) : Promise<IServiceMessage> => {
  // user_id 가 소유한 보관함 목록을 가져옵니다.
  // 그리고 buildingNumber, floorNumber, lockerNumber가 일치하는 보관함을 찾습니다.
  // 만약 해당 조건에 맞는 보관함이 있으면 해당 보관함에 sharedWith를 추가합니다.
  // sharedWith 를 추가하기 전 해당 아이디의 유저가 존재하는지 확인합니다.
  // 만약 유저가 존재하지 않는다면 에러를 발생시킵니다. (존재하지 않는 유저입니다.)

  console.log('[shareLocker] user_id: ', user_id)
  console.log('[shareLocker] buildingNumber: ', buildingNumber)
  console.log('[shareLocker] floorNumber: ', floorNumber)
  console.log('[shareLocker] lockerNumber: ', lockerNumber)
  console.log('[shareLocker] sharedWith: ', sharedWith)

  const userLockerList = await getUserLockerList(user_id)

  console.log('[shareLocker] userLockerList: ', userLockerList)

  const locker = userLockerList.find(
    locker =>
      Number(locker.buildingNumber) === Number(buildingNumber) &&
            Number(locker.floorNumber) === Number(floorNumber) &&
            Number(locker.lockerNumber) === Number(lockerNumber)
  )

  console.log('[shareLocker] locker: ', locker)

  if (!locker) {
    return { success: false, message: '해당 보관함을 찾을 수 없거나 등록되어 있지 않은 보관함입니다.' }
  }

  const sharedWithUser = await Users.findOne({ userId: sharedWith })

  if (!sharedWithUser) {
    return { success: false, message: '존재하지 않는 유저입니다.' }
  }
  if (user_id.equals(sharedWithUser._id)) {
    return { success: false, message: '자신에게 보관함을 공유할 수 없습니다.' }
  }

  console.log('[shareLocker] sharedWithUser: ', sharedWithUser)
  console.log('[shareLocker] sharedWithUser._id: ', sharedWithUser._id)

  const sharedWithUserId = new Types.ObjectId(sharedWithUser._id)

  locker.sharedWith.forEach(sharedWith => {
    console.log('[shareLocker] 중복 확인 sharedWith: ', sharedWith)
    console.log('[shareLocker] 중복 확인 sharedWithUserId: ', sharedWithUserId)
    if (sharedWithUserId.equals(sharedWith)) {
      return { success: false, message: '이미 공유된 유저입니다.' }
    }
  })

  const addSharedWithUser = await Lockers.findOneAndUpdate(
    { buildingNumber: buildingNumber },
    {
      $addToSet: {
        'floors.$[i].lockers.$[j].sharedWith': sharedWithUserId
      },
      $pull: {
        'floors.$[i].lockers.$[j].shareRequested': sharedWithUserId
      }
    },
    {
      arrayFilters: [
        { 'i.floorNumber': floorNumber },
        { 'j.lockerNumber': lockerNumber }
      ]
    }
  )

  return { success: true, message: '보관함이 성공적으로 공유되었습니다.' }
}

const cancelClaimedLocker = async (user_id: Types.ObjectId, buildingNumber: string, floorNumber: number, lockerNumber: number) : Promise<IServiceMessage> => {
  // 우선 소유중인 보관함인지 공유 받은 보관함인지 확인합니다.
  // 그리고 해당 보관함을 찾아 claimedBy 필드를 null로 업데이트합니다.

  const claimedLockers = await getUserLockerList(user_id)

  if(claimedLockers.length === 0) {
    return { success: false, message: '보관함이 존재하지 않습니다.' }
  }

  const locker = claimedLockers.find(
    locker =>
      Number(locker.buildingNumber) === Number(buildingNumber) &&
            Number(locker.floorNumber) === Number(floorNumber) &&
            Number(locker.lockerNumber) === Number(lockerNumber)
  )

  if (!locker) {
    return { success: false, message: '조건에 맟는 보관함을 찾을 수 없습니다.' }
  }

  if (locker.sharedWith.length > 0) {
    return { success: false, message: '공유된 보관함은 취소할 수 없습니다. 대신 소유권을 양도할 수 있습니다.', httpCode: 409}
  }

  await Lockers.findOneAndUpdate(
    { buildingNumber: buildingNumber },
    {
      $set: {
        'floors.$[i].lockers.$[j].claimedBy': null,
        'floors.$[i].lockers.$[j].status': 'Empty'
      }
    },
    {
      arrayFilters: [
        { 'i.floorNumber': floorNumber },
        { 'j.lockerNumber': lockerNumber }
      ]
    }
  )

  return { success: true, message: '보관함이 성공적으로 취소되었습니다.' }
}

const cancelSharedLocker = async (user_id: Types.ObjectId, buildingNumber: number, floorNumber: number, lockerNumber: number) : Promise<IServiceMessage> => {
  // 우선 소유중인 보관함인지 공유 받은 보관함인지 확인합니다.
  // 그리고 해당 보관함을 찾아 claimedBy 필드를 null로 업데이트합니다.

  const sharedLockers = await getUserSharedLockerList(user_id)

  if(sharedLockers.length === 0) {
    return { success: false, message: '공유받은 보관함이 존재하지 않습니다.' }
  }

  const locker = sharedLockers.find(
    locker =>
      locker.buildingNumber === buildingNumber &&
            Number(locker.floorNumber) === Number(floorNumber) &&
            Number(locker.lockerNumber) === Number(lockerNumber)
  )

  if (!locker) {
    return { success: false, message: '조건에 맟는 보관함을 찾을 수 없습니다.' }
  }

  // sharedWith 배열에서 user_id 만 제거합니다.
  await Lockers.findOneAndUpdate(
    { buildingNumber: buildingNumber },
    {
      $pull: {
        'floors.$[i].lockers.$[j].sharedWith': user_id
      }
    },
    {
      arrayFilters: [
        { 'i.floorNumber': floorNumber },
        { 'j.lockerNumber': lockerNumber }
      ]
    }
  )

  return { success: true, message: '보관함이 성공적으로 취소되었습니다.' }
}

const requestLockerShare = async (user_id: Types.ObjectId, buildingNumber: number, floorNumber: number, lockerNumber: number) : Promise<IServiceMessage> => {
  const lockerList = await getLockerList(buildingNumber, floorNumber)

  const locker = lockerList.find(
    locker => Number(locker.lockerNumber) === Number(lockerNumber)
  )

  if (!locker) {
    return { success: false, message: '해당 보관함을 찾을 수 없거나 등록되어 있지 않은 보관함입니다.' }
  }

  if (locker.status !== 'Share_Available') {
    return { success: false, message: '공유가 가능한 보관함이 아닙니다.' }
  }

  if (typeof locker.claimedBy !== 'undefined' && locker.claimedBy.equals(user_id)) {
    return { success: false, message: '자신이 소유한 보관함은 공유할 수 없습니다.' }
  }

  if (typeof locker.sharedWith !== 'undefined' && locker.sharedWith.includes(user_id)) {
    return { success: false, message: '이미 공유된 보관함입니다.' }
  }

  await Lockers.findOneAndUpdate(
    { buildingNumber: buildingNumber },
    {
      $addToSet: {
        'floors.$[i].lockers.$[j].shareRequested': user_id
      }
    },
    {
      arrayFilters: [
        { 'i.floorNumber': floorNumber },
        { 'j.lockerNumber': lockerNumber }
      ]
    }
  )

  return { success: true, message: '공유 요청이 완료되었습니다.' }
}

const checkLockerAccessByUserId = async (user_id: Types.ObjectId, buildingNumber: number, floorNumber: number, lockerNumber: number) : Promise<IServiceMessage> => {
  console.log('[Locker Service DEBUG] user_id: ', user_id)
  console.log('[Locker Service DEBUG] buildingNumber: ', buildingNumber)
  console.log('[Locker Service DEBUG] floorNumber: ', floorNumber)
  console.log('[Locker Service DEBUG] lockerNumber: ', lockerNumber)

  const targetLocker = await getLockerDetail(buildingNumber, floorNumber, lockerNumber, true)

  if (targetLocker.length === 0) {
    return { success: false, message: '해당 보관함을 찾을 수 없습니다.' }
  }

  // 관리자인지 확인.
  const admin = await adminServices.findAdminWithAssignedLocker(user_id)

  if (admin && admin.role === 'worker' && admin.assignedLocker.buildingNumber === buildingNumber) {
    return {
      success: true,
      message: '[마스터 키] 보관함에 접근할 수 있습니다.',
      value: {
        buildingName: targetLocker[0].buildingName,
        buildingNumber: Number(buildingNumber),
        floorNumber: Number(floorNumber),
        lockerNumber: Number(lockerNumber)
      }
    }
  }

  const claimedUser: IUser[] = targetLocker[0].claimedByUser
  const sharedUsers: IUser[] = targetLocker[0].sharedWithUsers

  const UserClaimed = claimedUser.find(user => user_id.equals(user._id));
  const UserInSharedUsers = sharedUsers.find(user => user_id.equals(user._id));

  if (UserClaimed || UserInSharedUsers) {
    const res = await Lockers.updateOne(
      { buildingNumber: (buildingNumber) },
      {
        $push: {
          'floors.$[i].lockers.$[j].accessHistory': {
            userId: UserClaimed?.userId || UserInSharedUsers?.userId,
            accessTime: new Date(),
            accessType: UserClaimed ? 'owner' : 'shared'
          }
        }
      },
      {
        arrayFilters: [
          { 'i.floorNumber': (floorNumber) },
          { 'j.lockerNumber': (lockerNumber) }
        ]
      }
    )

    return {
      success: true,
      message: '보관함에 접근할 수 있습니다.',
      value: {
        buildingName: targetLocker[0].buildingName,
        buildingNumber: Number(buildingNumber),
        floorNumber: Number(floorNumber),
        lockerNumber: Number(lockerNumber)
      }
    }
  } else {
    return { success: false, message: '보관함에 접근할 수 없습니다.' }
  }
}

const deleteLocker = async (buildingNumber: number, floorNumber: number, lockerNumber: number) : Promise<IServiceMessage> => {
  const delete_res = await Lockers.findOneAndUpdate(
    { buildingNumber: buildingNumber },
    {
      $pull: {
        'floors.$[i].lockers': { lockerNumber: lockerNumber }
      }
    },
    {
      arrayFilters: [
        { 'i.floorNumber': floorNumber }
      ]
    }
  )
  console.log('[deleteLocker] delete_res: ', delete_res)
  if (!delete_res) {
    return { success: false, message: '보관함을 삭제하는데 실패했습니다.', value: { buildingNumber, floorNumber, lockerNumber }}
  }
  return { success: true, message: '보관함이 성공적으로 삭제되었습니다.', value: { buildingNumber, floorNumber, lockerNumber  }}
}

export default {
  getAllBuildingList,
  getAllFloorListByBuildingNumber,
  getLockerList,
  getAllLockerList,
  getLockerDetail,
  getLockerStructure,
  getUserLockerList,
  getUserSharedLockerWithShareUserList,
  getUserLockerWithShareUserList,
  claimLocker,
  createLocker,
  shareLocker,
  cancelClaimedLocker,
  cancelSharedLocker,
  requestLockerShare,
  checkLockerAccessByUserId,
  deleteLocker
}
