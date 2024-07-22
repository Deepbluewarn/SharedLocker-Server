import express from 'express'
import { getUsersLocker, getUsersSharedLocker, updateUserNickname, updateUserRole } from '../controller/user.controller.js'
import { getUser } from '../controller/auth.controller.js'
import { searchUser } from '../controller/admin.controller.js'

const userRouter = express.Router()

userRouter.get('/user', getUser)
userRouter.get('/user/locker', getUsersLocker)
userRouter.get('/user/sharedLocker', getUsersSharedLocker)
userRouter.post('/user/nickname', updateUserNickname)
userRouter.post('/users', ...searchUser)
userRouter.post('/user/role', ...updateUserRole)

export default userRouter
