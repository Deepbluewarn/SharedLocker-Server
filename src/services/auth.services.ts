import bcrypt from 'bcryptjs'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import userServices from './user.services.js'
import { redisQRClient } from '../db/redis_init.js'
import { IQR } from '../interfaces/index.js'

const AuthService = {
  comparePassword: async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash)
  },
  generateToken: (user: Express.User) => {
    const token = jwt.sign(
      { username: user.email, id: user.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION_TIME
      }
    )
    return token
  },

  generateRefreshToken: (user: Express.User) => {
    const refreshToken = jwt.sign(
      { username: user.email, id: user.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME
      }
    )
    return refreshToken
  },

  generateNewHashedPassword: async (password: string) => {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    return hash
  },

  revokeRefreshToken: async (token: string) => {
    console.log('[authService] revokeRefreshToken token: ', token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload
    const user = await userServices.findUserByObjectId(decoded.id)

    if (!user) throw new Error('User not found')

    user.refreshToken = ''
    user.save()

    return user
  },

  generateQrKey: async (userId: string): Promise<IQR> => {
    console.log('[authService] generateQrKey userId: ', userId)

    // 8자리 랜덤 문자열 생성
    const key = Math.random().toString(36).substr(2, 8)
    // redis 에 위 문자열을 키 값으로 하는 유저 아이디와 유효기간으로 구성된 객체를 저장. 유효기간은 30초
    // redis 에 저장된 객체는 30초 후 자동으로 삭제됨\
    // 네트워크 지연 시간을 고려하여 4초 정도를 추가로 더해줌
    await redisQRClient.set(key, userId, 'EX', Number(process.env.QR_EXPIRATION_TIME) + 4).then(res => {
      console.log('[authService] generateQrKey redis res: ', res)
    })

    const createdAt = new Date().getTime();
    const expiredAt = new Date(createdAt + Number(process.env.QR_EXPIRATION_TIME) * 1000).getTime();

    return { key, expiredAt }
  },

  getUserIdByQrKey: async (qrKey: string) => {
    console.log('[authService] getUserIdByQrKey qrKey: ', qrKey)

    // redis 에서 qrKey 를 키 값으로 하는 유저 아이디를 가져옴
    const userId = await redisQRClient.get(qrKey)
    console.log('[authService] getUserIdByQrKey userId: ', userId)

    return userId
  }
}

export default AuthService
