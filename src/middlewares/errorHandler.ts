import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { ValidationError } from 'sequelize';

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  errors?: any[];
  name: string;
  message: string;
}

// Xử lý lỗi trong môi trường development
const sendErrorDev = (err: CustomError, res: Response): Response => {
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

// Xử lý lỗi trong môi trường production
const sendErrorProd = (err: CustomError, res: Response): Response => {
  // Lỗi hoạt động, gửi thông báo lỗi cho client
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
  
  // Lỗi lập trình hoặc lỗi không xác định: không leak chi tiết lỗi
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi. Vui lòng thử lại sau!'
  });
};

// Middleware xử lý lỗi toàn cục
const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Xử lý lỗi path-to-regexp
  if (err.message && err.message.includes('Missing parameter name at')) {
    console.error('Path-to-regexp error detected:', err.message);
    console.error('This usually means a route has an invalid parameter format');
    console.error('Check all your routes for formats like /:/ or missing parameter names after colons');
    
    // Lỗi này thường xuất hiện trong quá trình khởi động, nên không cần gửi response
    if (!res.headersSent) {
      sendErrorDev(
        new AppError('Lỗi định dạng route. Kiểm tra console để biết thêm chi tiết.', 500), 
        res
      );
      return;
    }
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Xử lý một số loại lỗi cụ thể
    let error: CustomError = { ...err };
    error.message = err.message;
    error.name = err.name;
    
    // Lỗi trùng key trong Sequelize
    if (err.name === 'SequelizeUniqueConstraintError') {
      error = new AppError('Dữ liệu đã tồn tại trong hệ thống.', 400);
    }
    
    // Lỗi validation từ Sequelize
    if (err.name === 'SequelizeValidationError') {
      const message = err.errors?.map(val => val.message).join('. ') || 'Lỗi xác thực dữ liệu';
      error = new AppError(message, 400);
    }
    
    // Lỗi JWT hết hạn
    if (err.name === 'TokenExpiredError') {
      error = new AppError('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!', 401);
    }
    
    // Lỗi JWT không hợp lệ
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Token không hợp lệ. Vui lòng đăng nhập lại!', 401);
    }
    
    sendErrorProd(error, res);
  }
};

export default errorHandler;