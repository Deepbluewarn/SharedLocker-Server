import { Request, Response, NextFunction } from "express";

const apiKey = process.env.API_LOCKER_KEY || 'your_api_key';

// 보관함 키오스크의 요청은 x-api-key 헤더에 인증 토큰을 포함해야 한다.
// 인증 토큰은 서버 측 환경 변수로 저장한다.

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-api-key'];
  if (key && key === apiKey) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};
