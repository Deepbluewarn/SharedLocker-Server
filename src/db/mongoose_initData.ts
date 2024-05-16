import Lockers from '../models/Lockers.js'
import Roles from '../models/Roles.js'

const initData = async () => {
  await Lockers.deleteMany({})
  await Roles.deleteMany({})

  const initialLockers = [
    {
      building: '정보공학관',
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
      building: '중앙도서관',
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

  await Lockers.insertMany(initialLockers)
  await Roles.insertMany(initialRoles)
}

export default initData
