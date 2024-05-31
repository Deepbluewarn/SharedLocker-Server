import { type NextFunction, type Request, type Response } from 'express'

export const checkUserRole = (requiredRoles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    if (req.admin && requiredRoles.includes(req.admin.role)) {
        return next();
    } else {
        return res.status(403).json({ success: false, message: '접근이 제한되었어요. 권한을 확인해주세요.' });
    }
};
