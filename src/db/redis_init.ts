import { Redis } from 'ioredis'
import dotenv from 'dotenv'
dotenv.config()

const qrClientOption = {
  host: 'localhost',
  port: process.env.REDIS_PORT as unknown as number,
  password: process.env.QR_REDIS_AUTH,
  db: 0
}

export const redisQRClient = new Redis(qrClientOption)

redisQRClient.on('connect', () => {
  console.log('connected to redis for session successfully!')
})

redisQRClient.on('error', (error) => {
  console.log('Redis for session connection error ', error)
})
