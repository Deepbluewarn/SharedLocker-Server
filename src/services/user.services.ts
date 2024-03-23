import Users from '../models/Users.js'

const UserService = {
  findUserByEmail: async (email: string) => {
    return await Users.findOne({ email })
  },
  findUserByObjectId: async (userId: string) => {
    return await Users.findOne({ userId })
  },

  /**
     *
     * @param userId email address.
     * @param password hashed password.
     * @returns Express.User
     */
  saveNewUser: async (userId: string, password: string) => {
    const newUser = new Users({ userId, password })

    return await newUser.save()
  }
}

export default UserService
