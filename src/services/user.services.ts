import AuthService from './auth.services.js'
import Admins from '../models/Admins.js'
import Users from '../models/Users.js'
import Lockers from '../models/Lockers.js'

const ADMIN_MASK = {
  role: 1,
  assignedLocker: 1,
}

const lookupForAdmin = {
  from: 'admins',
  localField: '_id',
  pipeline: [{ $project: ADMIN_MASK }],
  foreignField: 'userId',
  as: 'admin'
}
const UserService = {
  findUsersByUserId: async (userId: string) => {
    return (await Users.aggregate([
      { $match: { userId: { $regex: userId, $options: 'i' } } },
      { $lookup: lookupForAdmin },
      {
        $unwind: {
          path: '$admin',
          preserveNullAndEmptyArrays: true
        }
      },
      { $project: { password: 0, refreshToken: 0, __v: 0, _id: 0 } }
    ]))
  },
  findUserByUserId: async (userId: string) => {
    return (await Users.aggregate([
      { $match: { userId }},
      { $lookup: lookupForAdmin },
      {
        $unwind: {
          path: '$admin',
          preserveNullAndEmptyArrays: true
        }
      },
      { $project: { password: 0, refreshToken: 0, __v: 0, _id: 0 } }
    ]))[0]
  },
  /**
   * UserId로 Users를 찾습니다.
   * 이 함수는 백엔드 코드에서만 사용되며 API로 노출되지 않습니다.
   * @param userId 
   * @returns 
   */
  _findUserByUserId: async (userId: string) => {
    return await Users.findOne({ userId })
  },
  findUserByUserIdWithAdmin: async (userId: string) => {
    return (await Users.aggregate([
      { $match: { userId } },
      { $lookup: lookupForAdmin },
      {
        $unwind: {
          path: '$admin',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'lockers',
          localField: 'admin.assignedLocker',
          pipeline: [
            {
              $unwind: '$floors',
            },
            {
              $unwind: '$floors.lockers'
            },
            {
              $group: {
                _id: '$_id',
                buildingNumber: {$first: '$buildingNumber'},
                buildingName: {$first: '$buildingName'},
                lockers: {
                  $push: {
                    floorNumber: '$floors.floorNumber',
                    lockerNumber: '$floors.lockers.lockerNumber',
                    claimedBy: '$floors.lockers.claimedBy',
                    sharedWith: '$floors.lockers.sharedWith',
                    shareRequested: '$floors.lockers.shareRequested',
                    status: '$floors.lockers.status'
                  }
                }
              }
            }
          ],
          foreignField: '_id',
          as: 'assignedLocker'
        }
      },
      {
        $project: {
          userId: 1,
          nickname: 1,
          email: 1,
          admin: 1,
          assignedLocker: 1,
          createdAt: 1
        }
      }
    ]))[0]
  },

  /**
     *
     * @param userId email address.
     * @param password hashed password.
     * @returns Express.User
     */
  createUser: async (userId: string, password: string, nickname: string, email?: string) => {
    const hashedPwd = await AuthService.generateNewHashedPassword(password)

    const newUser = new Users({ userId, password: hashedPwd, nickname, email })

    return await newUser.save()
  },
  createOAuthUser: async (userId: string, nickname: string, email?: string) => {
    const newUser = new Users({ userId, nickname, email })

    return await newUser.save()
  },
  findUsersByNickname: async (nickname: string) => {
    return await Users.find({
      nickname: { $regex: nickname, $options: 'i' }
    }, {
      password: 0, refreshToken: 0, __v: 0, _id: 0
    })
  },
  /**
   * 
   * @param userId 
   * @param role 
   * @param assignedLockerBuildingNumber 
   * @returns 
   */
  updateUserRole: async (userId: string, role: string, assignedLockerBuildingNumber: string) => {
    // userId 는 유저가 지정한 아이디이고, Admins 컬렉션에서 요구하는 userId는 Users 컬렉션의 _id 이다.
    // 따라서 우선 Users 컬렉션에서 userId를 찾아서 _id를 가져와야 한다.

    console.log('updateUserRole userId: ', userId)
    console.log('updateUserRole role: ', role)
    console.log('updateUserRole assignedLockerBuildingNumber: ', assignedLockerBuildingNumber)
    
    if (role === 'worker' && !assignedLockerBuildingNumber) {
      throw new Error('실무 관리자는 담당 보관함을 지정해야 합니다.')
    }

    const locker = await Lockers.findOne({ buildingNumber: assignedLockerBuildingNumber })

    const user = await Users.findOne({ userId })

    console.log('updateUserRole user: ', user)

    if (!user) {
      throw new Error('회원 역할 수정 중 오류가 발생했습니다. 해당 유저를 찾을 수 없습니다.')
    }

    // 이미 관리자로 등록된 유저인지 확인하고, 요청한 역할이 이미 부여된 상태인지 확인한다.
    const admin = await Admins.findOne({ userId: user._id })

    console.log('updateUserRole admin: ', admin)

    if (!admin && role !== 'user') {
      // 관리자로 등록되지 않음. 새로 등록한다.
      await Admins.insertMany({ userId: user._id, role, assignedLocker: locker?._id })
    } else {
      // 관리자로 등록 됨. 역할을 수정한다.
      await Admins.updateOne({ userId: user._id }, { role, assignedLocker: locker?._id })
    }

    if (role === 'user') {
      // 유저로 변경 요청이 들어온 경우, 관리자 정보를 삭제한다.
      await Admins.deleteOne({ userId: user._id })
    }
  },

  checkAdminAvailable: async () => {
    return await Users.findOne({ userId: 'admin' })
  }
}

export default UserService
