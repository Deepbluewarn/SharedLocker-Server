import Lockers from '../models/Lockers.js'

const initData = async () => {
  await Lockers.deleteMany({})

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

  await Lockers.insertMany(initialLockers)
}

export default initData