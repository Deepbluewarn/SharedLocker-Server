import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import passport from './passport/setup.js';
import auth from './routes/auth.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = 4444;
// const MONGO_URL = 'mongodb://127.0.0.1:27017/loginTest';
const MONGO_URL = process.env.DB_CONNECTION;
mongoose
    .connect(MONGO_URL)
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch(err => {
    console.log(err);
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use('/auth', auth);
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});
