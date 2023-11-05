import Users from "../models/Users.js";

const UserService = {
    findUserByEmail: async (email: string) => {
        return await Users.findOne({ email });
    },
    findUserByObjectId: async (id: string) => {
        return await Users.findById(id);
    },
    
    /**
     * 
     * @param _id email address.
     * @param password hashed password.
     * @returns Express.User
     */
    saveNewUser: async (_id: string, password: string) => {
        const newUser = new Users({ _id, password });
        
        return await newUser.save();
    }
}

export default UserService;