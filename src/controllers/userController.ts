import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JwtPayload } from 'jsonwebtoken';
import { ApiResponse } from '../utils/apiResponse';
import dotenv from 'dotenv';

dotenv.config();

// Declare extended request interface with user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  } | JwtPayload;
}

// Tạo JWT tokens
const generateTokens = (id: number): { accessToken: string, refreshToken: string } => {
  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN || !process.env.REFRESH_TOKEN_SECRET || !process.env.REFRESH_TOKEN_EXPIRES_IN) {
    throw new Error('JWT environment variables are not properly defined');
  }
  
  // Tạo access token
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN as string, 10)
  });
  
  // Tạo refresh token
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN as string, 10)
  });
  
  return { accessToken, refreshToken };
};

// Xác lập cookie
const setTokenCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  // Access token cookie (thời gian ngắn hơn)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS trong production
    sameSite: 'strict',
    maxAge: parseInt(process.env.JWT_EXPIRES_IN as string, 10) * 1000 // Chuyển từ giây sang milliseconds
  });
  
  // Refresh token cookie (thời gian dài hơn)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN as string, 10) * 1000
  });
};

// Đăng ký người dùng mới
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json(
        ApiResponse.badRequest('Email đã được sử dụng. Vui lòng sử dụng email khác.')
      );
      return;
    }
    
    // Tạo người dùng mới
    const newUser = await User.create({
      name,
      email,
      password
    });
    
    // Tạo tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);
    
    // Loại bỏ password trước khi gửi response
    const user = newUser.toJSON() as { [key: string]: any };
    delete user.password;
    
    // Xác lập cookies
    setTokenCookies(res, accessToken, refreshToken);
    
    res.status(201).json(
      ApiResponse.created('Đăng ký tài khoản thành công', { user })
    );
  } catch (error) {
    next(error);
  }
};

// Đăng nhập
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Kiểm tra email và password có tồn tại
    if (!email || !password) {
      res.status(400).json(
        ApiResponse.badRequest('Vui lòng cung cấp email và mật khẩu')
      );
      return;
    }
    
    // Kiểm tra user tồn tại và password chính xác
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.isPasswordMatch(password))) {
      res.status(401).json(
        ApiResponse.unauthorized('Email hoặc mật khẩu không chính xác')
      );
      return;
    }
    
    // Tạo tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Loại bỏ password trước khi gửi response
    const userData = user.toJSON() as { [key: string]: any };
    delete (userData as { password?: string }).password;
    
    // Xác lập cookies
    setTokenCookies(res, accessToken, refreshToken);
    
    res.status(200).json(
      ApiResponse.success('Đăng nhập thành công', { user: userData })
    );
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findByPk(req.user?.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy người dùng')
      );
      return;
    }
    
    res.status(200).json(
      ApiResponse.success('Lấy thông tin người dùng thành công', { user })
    );
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin người dùng
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    
    const user = await User.findByPk(req.user?.id);
    
    if (!user) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy người dùng')
      );
      return;
    }
    
    // Cập nhật thông tin người dùng
    user.name = name || user.name;
    await user.save();
    
    // Loại bỏ password trước khi gửi response
    const userData = user.toJSON();
    delete (userData as { password?: string }).password;
    
    res.status(200).json(
      ApiResponse.success('Cập nhật thông tin người dùng thành công', { user: userData })
    );
  } catch (error) {
    next(error);
  }
};

// Đổi mật khẩu
export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.user?.id);
    
    if (!user) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy người dùng')
      );
      return;
    }
    
    // Kiểm tra mật khẩu hiện tại có đúng không
    if (!(await user.isPasswordMatch(currentPassword))) {
      res.status(401).json(
        ApiResponse.unauthorized('Mật khẩu hiện tại không chính xác')
      );
      return;
    }
    
    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();
    
    res.status(200).json(
      ApiResponse.success('Đổi mật khẩu thành công')
    );
  } catch (error) {
    next(error);
  }
};