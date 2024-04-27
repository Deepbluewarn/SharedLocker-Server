import Users from '../models/Users.js'

const UserService = {
  findUserByEmail: async (email: string) => {
    return await Users.findOne({ email })
  },
  findUserByObjectId: async (userId: string) => {
    return await Users.findOne({ userId })
  },
  getUserProfile: async (userId: string) => {
    return await Users.findOne({ userId }, { password: 0, refreshToken: 0, __v: 0, _id: 0 })
  },

  /**
     *
     * @param userId email address.
     * @param password hashed password.
     * @returns Express.User
     */
  saveNewUser: async (userId: string, password: string, nickname: string, email: string) => {
    const newUser = new Users({ userId, password, nickname, email })

    return await newUser.save()
  }
}

export default UserService
