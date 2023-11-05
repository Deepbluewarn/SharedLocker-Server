import { NextFunction, Request, Response } from "express";
import passport from "passport";

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
    passport.authenticate('register', (err, user, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }

        if (!user) {
            return res.status(400).json({ errors: info.message });
        }

        res.status(200).json({success: `registered ${user.id}`});
    })(req, res, next);
}

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('login', (err, user, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }

        if (!user) {
            return res.status(400).json({ errors: 'No user found' });
        }
        
        setTokenCookie(res, 'refreshToken', user.refreshToken);
        setTokenCookie(res, 'accessToken', info.message);

        res.status(200).json({success: true, message: `logged in ${user.id}`});
    })(req, res, next);
}

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('logout', (err, user, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }

        if (!user) {
            return res.status(400).json({ errors: info.message });
        }

        res.status(200).json({success: true, message: info.message});
    })(req, res, next);
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('user', (err, user, info) => {
        if (err) {
            return res.status(400).json({ errors: err });
        }

        if (!user) {
            return res.status(400).json({ errors: info.message });
        }

        res.status(200).json({success: true, message: user});
    })(req, res, next);
}

export const getNewToken = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('token', (err, user, info) => {
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