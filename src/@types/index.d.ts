import { IUser } from '../models/Users.js';
import passport from 'passport';

declare global {
  namespace Express {
    interface User {
        id: string;
        name: string;
        email: string;
        isEmailVerified: boolean;
        password: string;
        referral_code: string;
        referred_by: string;
        thirdPartyAuth: Array<any>;
        createdAt: Date;
    }
  }
  interface IVerifyOptions {
    message: any;
  }
}

export {};