import express from 'express';
import { getUsersLocker } from '../controller/user.controller.js';

const userRouter = express.Router();

userRouter.get("/user/locker", getUsersLocker);

export default userRouter;