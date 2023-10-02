import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const authService = {
    comparePassword: async (password, hash) => {
        return await bcrypt.compare(password, hash);
    },
    generateToken: (user) => {
        const token = jwt.sign({ username: user.email, id: user.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        return token;
    },
    generateRefreshToken: (user) => {
        const refreshToken = jwt.sign({ username: user.email, id: user.id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });
        return refreshToken;
    },
    generateNewHashedPassword: async (password) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            return hash;
        }
        catch (err) {
            throw err;
        }
    },
};
export default authService;
