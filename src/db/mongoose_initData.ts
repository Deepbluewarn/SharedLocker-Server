import Admins from '../models/Admins.js'
import Lockers from '../models/Lockers.js'
import Roles from '../models/Roles.js'
import AdminServices from '../services/admin.services.js'
import UserService from '../services/user.services.js'

const initialLockers = [
  {
    buildingNumber: 23,
    buildingName: '정보공학관',
    floors: [
      {
        floorNumber: 1,
        lockers: [
          {
            lockerNumber: 101,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 102,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 103,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 104,
            claimedBy: null,
            sharedWith: []
          }
        ]
      },
      {
        floorNumber: 8,
        lockers: [
          {
            lockerNumber: 101,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 102,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 103,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 104,
            claimedBy: null,
            sharedWith: []
          }
        ]
      }
    ]
  }, {
    buildingNumber: 12,
    buildingName: '중앙도서관',
    floors: [
      {
        floorNumber: 1,
        lockers: [
          {
            lockerNumber: 101,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 102,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 103,
            claimedBy: null,
            sharedWith: []
          },
          {
            lockerNumber: 104,
            claimedBy: null,
            sharedWith: []
          }
        ]
      }
    ]
  }
]

const initialRoles = [
  {
    name: '운영 관리자',
    role: 'operator'
  },
  {
    name: '실무 관리자',
    role: 'worker'
  },
  {
    name: '사용자',
    role: 'user'
  }
]

async function initializeAdmin() {
  // Check if there are any users in the Users collection
  const users = await UserService.checkAdminAvailable()
  if (!users) {
    // If not, create an admin user
    const adminUser = await UserService.createUser('admin', 'admin1234', '최초의 관리자')

    // Then, create an admin document in the Admins collection that references the new user
    await AdminServices.createAdmin(adminUser._id, 'operator')

    console.log('Admin user created with username "admin" and password "admin".')
  }
}

const initData = async () => {
  if (await Lockers.countDocuments() === 0) {
    await Lockers.insertMany(initialLockers)
  }

  if (await Roles.countDocuments() === 0) {
    await Roles.insertMany(initialRoles)
  }
  
  initializeAdmin()
}

export default initData
