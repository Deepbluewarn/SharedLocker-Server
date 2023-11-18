import { NextFunction, Request, Response } from "express";
import passport from "passport";
import Users, { IUser } from "../models/Users";

type tokenType = 'accessToken' | 'refreshToken';

export const setTokenCookie = (res: Response, type: tokenType, token: string | null) => {
    res.cookie(type === 'accessToken' ? 'Authorization' : 'refreshToken',
        token,
        {
            domain: '.ngrok-free.app',
            httpOnly: true, secure: true, sameSite: 'strict'
        })
}

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('register', (err, user: IUser, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }

        if(!info.success){
            return res.status(400).json(info);
        }
        
        res.status(200).json(info);
    })(req, res, next);
}

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('login', (err, user: IUser, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }

        if(!info.success){
            return res.status(400).json(info);
        }
        
        // setTokenCookie(res, 'refreshToken', user.refreshToken);
        // setTokenCookie(res, 'accessToken', info.message);

        res.status(200).json(info);
    })(req, res, next);
}

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('logout', (err, user: IUser, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }

        if(!info.success){
            return res.status(400).json(info);
        }

        res.status(200).json(info);
    })(req, res, next);
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('user', (err, user: IUser, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }

        if(!info.success){
            return res.status(400).json(info);
        }

        res.status(200).json(info);
    })(req, res, next);
}

export const getNewToken = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('token', (err, user: IUser, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }
        if(!info.success){
            return res.status(400).json(info);
        }

        res.cookie('refreshToken',
            info.refreshToken,
            {
                domain: '.ngrok-free.app',
                httpOnly: true, secure: true, sameSite: 'strict'
            })

        res.cookie('Authorization', 
            info.accessToken, 
            { 
                domain: '.ngrok-free.app',
                httpOnly: true, secure: true, sameSite: 'strict'
            })

        res.status(200).json(info);
    })(req, res, next);
}