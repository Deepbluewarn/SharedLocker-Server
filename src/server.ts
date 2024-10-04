import express from 'express'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import passport from './services/passport/setup.js'
import auth from './routes/auth.js'
import dotenv from 'dotenv'
import initData from './db/mongoose_initData.js'
import lockerRouter from './routes/locker.js'
import userRouter from './routes/user.js'
import adminRouter from './routes/admin.js'
import './mqtt/index.js'
import cors from 'cors'

dotenv.config()

const app = express()
const port = 4443
const MONGO_URL = process.env.DB_CONNECTION

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB')
    initData()
  })
  .catch(err => {
    console.log(err)
  })

app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(passport.initialize())

app.use('/auth', auth)
app.use('/api', lockerRouter)
app.use('/api', userRouter)
app.use('/api', adminRouter)
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`)
})
