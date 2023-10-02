import { VerifyFunction } from 'passport-local';
import UsersModel from '../models/Users.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const authService = {
    comparePassword: async (password: string, hash: string) => {
        return await bcrypt.compare(password, hash);
    },
    generateToken: (user: Express.User) => {
        const token = jwt.sign(
            { username: user.email, id: user.id },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );
        return token;
    },

    generateRefreshToken: (user: Express.User) => {
        const refreshToken = jwt.sign(
            { username: user.email, id: user.id },
            process.env.JWT_SECRET,
            {
                expiresIn: "30d",
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
}

export default authService;