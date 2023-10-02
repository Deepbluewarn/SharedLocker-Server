import mongoose from 'mongoose';
const ThirdPartyProviderSchema = new mongoose.Schema({
    provider_name: {
        type: String,
        default: null,
    },
    provider_id: {
        type: String,
        default: null,
    },
    provider_data: {
        type: {},
        default: null,
    }
});
const UserSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    referral_code: {
        type: String,
        default: function () {
            let hash = 0;
            for (let i = 0; i < this.email.length; i++) {
                hash = this.email.charCodeAt(i) + ((hash << 5) - hash);
            }
            let res = (hash & 0x00ffffff).toString(16).toUpperCase();
            return "00000".substring(0, 6 - res.length) + res;
        }
    },
    referred_by: {
        type: String,
        default: null
    },
    thirdPartyAuth: [ThirdPartyProviderSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { strict: false });
const Users = mongoose.model('users', UserSchema);
const UsersModel = {
    findUserByEmail: async (email) => {
        return await Users.findOne({ email });
    },
    findUserByObjectId: async (id) => {
        return await Users.findById(id);
    },
    /**
     *
     * @param email email address.
     * @param password hashed password.
     * @returns Express.User
     */
    saveNewUser: async (email, password) => {
        const newUser = new Users({ email, password });
        return await newUser.save();
    }
};
export default UsersModel;
