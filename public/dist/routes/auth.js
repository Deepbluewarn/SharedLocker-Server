import express from 'express';
import passport from 'passport';
const router = express.Router();
console.log('[router] auth.ts init');
router.post("/register", async (req, res, next) => {
    console.log('[auth.ts] POST /register req.body: ', req.body);
    passport.authenticate('register', (err, user, info) => {
        console.log(`[auth.ts] POST /register passport.authenticate: err: ${err}, user: ${user}, info: ${info}`);
        if (err) {
            return res.status(400).json({ errors: err });
        }
        if (!user) {
            return res.status(400).json({ errors: '계정 생성 실패' });
        }
        res.status(200).json({ success: `registered ${user.id}` });
    })(req, res, next);
});
router.post('/login', (req, res, next) => {
    console.log('[auth.ts] POST /login req.body: ', req.body);
    passport.authenticate('login', (err, user, info) => {
        console.log('[auth.ts] POST /login passport.authenticate: err: ', err, ', user: ', user, ', info: ', info);
        if (err) {
            return res.status(400).json({ errors: err });
        }
        if (!user) {
            return res.status(400).json({ errors: 'No user found' });
        }
        res.cookie('refreshToken', user.refreshToken, {
            domain: '.ngrok-free.app',
            httpOnly: true, secure: true, sameSite: 'strict'
        });
        res.cookie('Authorization', user.accessToken, {
            domain: '.ngrok-free.app',
            httpOnly: true, secure: true, sameSite: 'strict'
        });
        res.status(200).json({ success: true, message: `logged in ${user.id}` });
    })(req, res, next);
});
router.post('/token', (req, res, next) => {
    console.log('[auth.ts] POST /token req.body: ', req.body);
    passport.authenticate('token', (err, user, info) => {
        console.log('[auth.ts] POST /token passport.authenticate: err: ', err, ', user: ', user, ', info: ', info);
        if (err) {
            return res.status(400).json({ errors: err });
        }
        if (!user) {
            return res.status(400).json({ errors: 'No user found' });
        }
        // DB 에 접근해서 refreshToken 을 비교하여 유효성을 확인한다.
        // refreshToken 이 유효하다면 accessToken 과 refreshToken 을 새로 발급한다.
        res.cookie('refreshToken', user.refreshToken, {
            domain: '.ngrok-free.app',
            httpOnly: true, secure: true, sameSite: 'strict'
        });
        res.cookie('Authorization', user.accessToken, {
            domain: '.ngrok-free.app',
            httpOnly: true, secure: true, sameSite: 'strict'
        });
        res.status(200).json({
            success: true,
            accessToken: user.accessToken,
            refreshToken: user.refreshToken
        });
    })(req, res, next);
});
router.get('/np', (req, res) => {
    res.send('You have accessed a non-protected route!');
});
router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.send('You have accessed a protected route!');
});
export default router;
