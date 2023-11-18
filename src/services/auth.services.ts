import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import userServices from './user.services.js';

const AuthService = {
    comparePassword: async (password: string, hash: string) => {
        return await bcrypt.compare(password, hash);
    },
    generateToken: (user: Express.User) => {
        const token = jwt.sign(
            { username: user.email, id: user.userId },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRATION_TIME,
            }
        );
        return token;
    },

    generateRefreshToken: (user: Express.User) => {
        const refreshToken = jwt.sign(
            { username: user.email, id: user.userId },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME,
            }
        );
        return refreshToken;
    },

    generateNewHashedPassword: async (password: string) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            return hash;
        } catch (err) {
            throw err;
        }
    },

    revokeRefreshToken: async (token: string) => {
        try {
            console.log('[authService] revokeRefreshToken token: ', token)
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
            const user = await userServices.findUserByObjectId(decoded.id);

            if (!user) throw new Error('User not found');

            user.refreshToken = '';
            user.save();

            return user;
        } catch (err) {
            throw err;
        }
    },
}

export default AuthService;