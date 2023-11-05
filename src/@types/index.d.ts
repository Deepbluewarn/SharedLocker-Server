import { IUser } from '../models/Users.js';
import passport from 'passport';

declare global {
  namespace Express {
    interface User {
      _id: string;
      name: string;
      email: string;
      password: string;
      createdAt: Date;
      refreshToken?: string;
    }
  }
  interface IVerifyOptions {
    message: any;
  }
}

export { };