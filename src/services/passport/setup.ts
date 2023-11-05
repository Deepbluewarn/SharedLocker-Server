import passport from 'passport';
import { Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt, JwtFromRequestFunction, VerifiedCallback } from 'passport-jwt';

import dotenv from 'dotenv';
import AuthService from '../auth.services.js';
import UserService from '../user.services.js';

dotenv.config();

passport.use('login',
    new LocalStrategy({ usernameField: 'id' }, async (userId, password, done) => {
        UserService.findUserByObjectId(userId).then((user) => {
            if (!user) {
                return done(null, false, { message: '계정이 존재하지 않습니다.' });
            } else {
                AuthService.comparePassword(password, user.password).then((isMatch) => {
                    if (isMatch) {
                        const accessToken = AuthService.generateToken(user as Express.User);
                        user.refreshToken = AuthService.generateRefreshToken(user as Express.User);
    
                        user.save();
    
                        return done(null, user as Express.User, { message: accessToken });
                    } else {
                        return done(null, false, { message: 'Invalid id or password.' });
                    }
                });
            }
        }).catch(err => {
            console.log(err);
            return done(null, false, { message: 'Something went wrong.' });
        })
    })
)

passport.use('logout',
    new JwtStrategy({
        // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        jwtFromRequest: (req) => tokenExtractor(req, 'Authorization'),
        secretOrKey: process.env.JWT_SECRET
    }, (jwt_payload, done) => {
        console.log('[passport logout] jwt_payload: ', jwt_payload);

        UserService.findUserByObjectId(jwt_payload.id).then((user) => {
            if (!user) {
                return done(null, false, {success: false, message: 'User not found'})
            }else{
                AuthService.revokeRefreshToken(user.refreshToken).then(user => {
                    return done(null, user as Express.User, { success: true, message: `Logged out. user ${user.id}` });
                }).catch(err => {
                    return done(null, user as Express.User, { success: false, message: `오류 발생` });
                });
            }
        })
        .catch(err => {
            return done(err, false, { success: false, message: err });
        })
    })
)

passport.use('register',
    new LocalStrategy({ usernameField: 'id', passReqToCallback: true }, async (req, userId, password, done) => {
        console.log(`[passport register] userId: ${userId}, password: ${password}`);
        console.log(`[passport register] name: ${req.body['name']}, email: ${req.body['email']}`);

        // request 객체를 받아서 유저의 이름과 이메일을 받아 saveNewUser 함수로 전달.

        UserService.findUserByObjectId(userId)
            .then(async (user) => {
                console.log('[passport register] findUserByObjectId user: ', user);
                if (user) {
                    return done(null, false, { message: 'ID already exists.' });
                }else{
                    const hashedPwd = await AuthService.generateNewHashedPassword(password);
                    console.log('[passport register] findUserByObjectId hashedPwd: ', hashedPwd);
                    UserService.saveNewUser(userId, hashedPwd)
                        .then((user) => {
                            console.log('[UserService] saveNewUser newUser: ', user);
                            return done(null, user);
                        });
                }
            })
            .catch((err) => {
                return done(null, false, { message: 'Something went wrong.' });
            });
    })
)

// 일반 권한 확인 (모든 사용자)
passport.use('user',
    new JwtStrategy({
        jwtFromRequest: (req) => tokenExtractor(req, 'Authorization'),
        secretOrKey: process.env.JWT_SECRET,
        passReqToCallback: true
    }, (req: Request, jwt_payload: JwtPayload, done: VerifiedCallback) => {

        console.log('[passport jwt_payload]: ', jwt_payload);

        if (!jwt_payload) return done(null, false, {success: false, message: '권한 없음'});

        // 토큰의 정보를 기반으로 가입 여부 확인.
        // 토큰에 해당하는 유저가 있으면 해당 유저의 객체를 반환한다.
        UserService.findUserByObjectId(jwt_payload.id).then((user) => {
            if (user) {
                return done(null, user as Express.User);
            } else {
                return done(null, false);
            }
        }).catch(err => {
            console.log('[passport user]: ', err);
            return done(err, false);
        });
    })
)

// Refresh Token 유효성 확인 및 토큰 재발급 전략
passport.use('token',
    new JwtStrategy({
        jwtFromRequest: (req) => tokenExtractor(req, 'refreshToken'),
        secretOrKey: process.env.JWT_SECRET,
        passReqToCallback: true
    }, (req: Request, jwt_payload: JwtPayload, done: VerifiedCallback) => {

        console.log('[passport refresh jwt_payload]: ', jwt_payload);

        if (!jwt_payload) return done(null, false);

        // DB 의 Refresh Token 과 유저의 RT 를 비교하여 유효성을 확인한다.
        // 만약 일치하면 jwt.verify() 로 유저의 rt 를 한번 더 검증한다.

        UserService.findUserByObjectId(jwt_payload.id).then(user => {
            // 공격자가 Token 을 탈취하여 유저의 AccessToken 을 발급받으면
            // DB 에는 공격자의 RefreshToken 이 저장된다.
            // 정상 유저가 클라이언트에 가지고 있던 RefreshToken 과 DB 의 RT 를 비교해야 한다.
            // 만약 불일치 한 경우 로그아웃.

            // DB 에 RefreshToken 이 없는 경우.
            if (!user.refreshToken) return done(null, false, {success: false, message: 'Refresh Token 이 없습니다.'});

            const dbRefreshToken = jwt.verify(user.refreshToken, process.env.JWT_SECRET) as JwtPayload;

            if (jwt_payload.iat !== dbRefreshToken.iat || jwt_payload.exp !== dbRefreshToken.exp) {
                return done(null, false, {success: false, message: 'Refresh Token 이 일치하지 않습니다.'});
            }

            const newAccessToken = AuthService.generateToken(user);
            const newRefreshToken = AuthService.generateRefreshToken(user);
            user.refreshToken = AuthService.generateRefreshToken(user);

            user.save();

            return done(null, false, {
                success: true, 
                accessToken: newAccessToken, 
                refreshToken: newRefreshToken,
                message: '새로운 토큰이 발급되었습니다.'
            });
        })
    })
)

const tokenExtractor = (req: Request, tokenType: 'Authorization' | 'refreshToken') => {
    let token = null;

    console.log('[tokenExtractor req.cookies]: ', req.cookies);

    if (req && req.cookies) {
        token = req.cookies[tokenType];
    }
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            token = authHeader.split(' ')[1];
        }
    }
    return token;
};

export default passport;