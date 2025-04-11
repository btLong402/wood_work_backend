import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/database';
import errorHandler from './middlewares/errorHandler';
import { logger, accessLogger } from './middlewares/logger';
import userRoutes from './routes/userRoutes';
import { AppError } from './utils/appError';

// Khởi tạo dotenv
dotenv.config();

// Khởi tạo app Express
const app = express();

// Kết nối database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true // Cho phép gửi cookie qua CORS
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Thêm middleware để xử lý cookie

// Apply Morgan logger
app.use(accessLogger); // Log tất cả các request vào file
app.use(logger()); // Log dựa trên môi trường (dev/prod)

// Basic route to check if server is running
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Wood Work API' });
});

// API Routes
app.use('/api/users', userRoutes);

// Print all registered routes for debugging
console.log('\nAll registered routes:');
app._router?.stack.forEach((middleware: any) => {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(`${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Routes added as router middleware
    middleware.handle?.stack?.forEach((handler: any) => {
      if (handler.route) {
        const method = Object.keys(handler.route.methods)[0].toUpperCase();
        console.log(`${method} /api/users${handler.route.path}`);
      }
    });
  }
});

// Xử lý route không tồn tại - sử dụng app.use thay vì app.all
app.use((req: Request, _res: Response, next: NextFunction) => {
  const err = new AppError(`Không tìm thấy ${req.originalUrl} trên máy chủ này!`, 404);
  next(err);
});

// Middleware xử lý lỗi
app.use(errorHandler);

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port: ${PORT}`);
});

// Xử lý lỗi không bắt được (Unhandled Promise rejections)
process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});



