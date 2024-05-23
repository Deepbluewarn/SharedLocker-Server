import bcrypt from 'bcryptjs'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import userServices from './user.services.js'
import { redisQRClient } from '../db/redis_init.js'
import { IQR } from '../interfaces/index.js'
import Roles from '../models/Roles.js'


const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash)
}

const generateToken = (user: Express.User) => {
  const token = jwt.sign(
    { username: user.email, id: user.userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRATION_TIME
    }
  )
  return token
}

const generateRefreshToken = (user: Express.User) => {
  const refreshToken = jwt.sign(
    { username: user.email, id: user.userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME
    }
  )
  return refreshToken
}

const generateNewHashedPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

const revokeAccessToken = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload
  const user = await userServices.findUserByUserId(decoded.id)

  if (!user) throw new Error('User not found')

  setBlackList(token, decoded.exp)

  return user
}

const revokeRefreshToken = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload
  const user = await userServices.findUserByUserId(decoded.id)

  if (!user) throw new Error('User not found')

  setBlackList(token, decoded.exp)

  user.refreshToken = ''
  user.save()

  return user
}

const generateQrKey = async (userId: string): Promise<IQR> => {
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
}

const getUserIdByQrKey = async (qrKey: string) => {
  console.log('[authService] getUserIdByQrKey qrKey: ', qrKey)

  // redis 에서 qrKey 를 키 값으로 하는 유저 아이디를 가져옴
  const userId = await redisQRClient.get(qrKey)
  console.log('[authService] getUserIdByQrKey userId: ', userId)

  return userId
}

const setBlackList = async (token: string, expiredAtSec: number) => {
  console.log('[authService] setBlackList token: ', token, 'expiredAtSec: ', expiredAtSec)
  const now = Math.floor(new Date().getTime() / 1000)
  const diff = expiredAtSec - now

  if (diff <= 0) return

  await redisQRClient.set(token, 'token', 'EX', diff).then(res => {
    console.log('[authService] 토큰 블랙리스트 등록 됨. res: ', res)
  })
}

const checkBlackList = async (token: string) => {
  const res = await redisQRClient.get(token)

  if (res) {
    return true
  }

  return false
}

const getRoleList = async () => {
  return await Roles.find({}, { _id: 0, __v: 0})
}


export default {
  comparePassword,
  generateToken,
  generateRefreshToken,
  generateNewHashedPassword,
  revokeAccessToken,
  revokeRefreshToken,
  generateQrKey,
  getUserIdByQrKey,
  setBlackList,
  checkBlackList,
  getRoleList
}
