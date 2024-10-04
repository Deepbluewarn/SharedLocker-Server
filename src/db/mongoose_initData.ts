import Admins from '../models/Admins.js'
import Lockers from '../models/Lockers.js'
import Roles from '../models/Roles.js'
import AdminServices from '../services/admin.services.js'
import UserService from '../services/user.services.js'

function getRandomFloorCount() {
  const floorCounts = [2, 4, 8];
  return floorCounts[Math.floor(Math.random() * floorCounts.length)];
}

function generateLockersForFloor(floorNumber: number) {
  const lockers = [];
  for (let i = 1; i <= 10; i++) {
    lockers.push({
      lockerNumber: i,
      claimedBy: null,
      sharedWith: []
    });
  }
  return {
    floorNumber,
    lockers
  };
}

function generateFloors() {
  const floorCount = getRandomFloorCount();
  const floors = [];
  for (let i = 1; i <= floorCount; i++) {
    floors.push(generateLockersForFloor(i));
  }
  return floors;
}

const buildings = [
  { buildingNumber: 1, buildingName: '대학본관' },
  { buildingNumber: 2, buildingName: '법정관' },
  { buildingNumber: 3, buildingName: '상경관' },
  { buildingNumber: 5, buildingName: '국제관' },
  { buildingNumber: 7, buildingName: '상영관(제2학생회관)' },
  { buildingNumber: 8, buildingName: '수덕전(학생회관)' },
  { buildingNumber: 9, buildingName: '제1인문관' },
  { buildingNumber: 10, buildingName: '제2인문관' },
  { buildingNumber: 12, buildingName: '중앙도서관' },
  { buildingNumber: 15, buildingName: '의료보건관' },
  { buildingNumber: 16, buildingName: '생활과학관' },
  { buildingNumber: 17, buildingName: '음악관' },
  { buildingNumber: 18, buildingName: '창의관' },
  { buildingNumber: 19, buildingName: '지천관' },
  { buildingNumber: 20, buildingName: '산학협력관' },
  { buildingNumber: 21, buildingName: '건윤관' },
  { buildingNumber: 22, buildingName: '공학관' },
  { buildingNumber: 23, buildingName: '정보공학관' }
];

const initialLockers = buildings.map(building => ({
  buildingNumber: building.buildingNumber,
  buildingName: building.buildingName,
  floors: generateFloors()
}));

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
