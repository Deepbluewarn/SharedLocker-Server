import express from 'express'
import { getUsersLocker, getUsersSharedLocker } from '../controller/user.controller.js'

const userRouter = express.Router()

userRouter.get('/user/locker', getUsersLocker)
userRouter.get('/user/sharedLocker', getUsersSharedLocker)

export default userRouter
