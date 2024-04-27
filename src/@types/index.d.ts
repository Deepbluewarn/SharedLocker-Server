/* eslint-disable @typescript-eslint/no-unused-vars */
import { IUser } from '../models/Users.js'
import passport from 'passport'

declare global {
  namespace Express {
    interface User {
      userId: string
      nickname: string
      email: string
      password: string
      createdAt: Date
      refreshToken?: string
    }
  }
}
declare module 'passport-local'{
  interface IVerifyOptions {
    message: string
    success: boolean
    token?: any
  }
}
