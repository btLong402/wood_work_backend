import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ApiResponse } from '../utils/apiResponse';

dotenv.config();

// Define custom JWT payload type with id
interface CustomJwtPayload extends jwt.JwtPayload {
  id: string;
}

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: CustomJwtPayload;
    }
  }
}

const auth = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    // Lấy token từ cookies thay vì header
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
      return res.status(401).json(
        ApiResponse.unauthorized('Không có quyền truy cập. Vui lòng đăng nhập.')
      );
    }
    
    // Xác thực token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET as string) as CustomJwtPayload;
    
    // Make sure the decoded token has an id property
    if (!decoded.id) {
      return res.status(401).json(
        ApiResponse.unauthorized('Token không hợp lệ. Vui lòng đăng nhập lại.')
      );
    }
    
    // Thêm thông tin user vào request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json(
      ApiResponse.unauthorized('Không có quyền truy cập. Token không hợp lệ hoặc đã hết hạn.')
    );
  }
};

// Refresh token middleware
export const refreshAuth = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    // Lấy refresh token từ cookies
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json(
        ApiResponse.unauthorized('Không có refresh token. Vui lòng đăng nhập lại.')
      );
    }
    
    // Xác thực refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.REFRESH_TOKEN_SECRET as string
    ) as CustomJwtPayload;
    
    // Tạo access token mới
    const newAccessToken = jwt.sign(
      { id: decoded.id }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: parseInt(process.env.JWT_EXPIRES_IN as string, 10) }
    );
    
    // Cập nhật cookie với access token mới
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.JWT_EXPIRES_IN as string, 10) * 1000
    });
    
    // Thêm thông tin user vào request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json(
      ApiResponse.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    );
  }
};

// Xóa tokens khi đăng xuất
export const clearTokens = (_req: Request, res: Response): void => {
  res.cookie('accessToken', '', { maxAge: 0 });
  res.cookie('refreshToken', '', { maxAge: 0 });
};

export default auth;