import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import dotenv from 'dotenv';
import authService from '../services/auth.services.js';
import UsersModel from '../models/Users.js';

dotenv.config();

passport.use('login',
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        UsersModel.findUserByEmail(email).then((user) => {
            if (!user) return done(null, false, { message: '계정이 존재하지 않습니다.' });

            authService.comparePassword(password, user.password).then((isMatch) => {
                if (isMatch) {
                    user.accessToken = authService.generateToken(user as Express.User);
                    user.refreshToken = authService.generateRefreshToken(user as Express.User);

                    return done(null, user as Express.User);
                } else {
                    return done(null, false, { message: 'Invalid email or password.' });
                }
            });
        }).catch(err => {
            console.log(err);
            return done(null, false, { message: 'Something went wrong.' });
        })
    })
)

passport.use('register',
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        console.log(`[passport register] email: ${email}, password: ${password}`);

        UsersModel.findUserByEmail(email)
            .then(async (user) => {
                if (user) return done(null, false, { message: 'Email already exists.' });

                const hashedPwd = await authService.generateNewHashedPassword(password);
                return UsersModel.saveNewUser(email, hashedPwd);
            })
            .then((user) => {
                return done(null, user as Express.User);
            })
            .catch((err) => {
                return done(null, false, { message: 'Something went wrong.' });
            });
    })
)

passport.use(
    new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromExtractors([
            (request) => request?.cookies?.Authorization
        ]),
        secretOrKey: process.env.JWT_SECRET
    }, (jwt_payload, done) => {

        console.log('[passport jwt_payload]: ', jwt_payload);

        UsersModel.findUserByObjectId(jwt_payload.id).then((user) => {
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        }).catch(err => {
            return done(err, false);
        });
    })
)

export default passport;