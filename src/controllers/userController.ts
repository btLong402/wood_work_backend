import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { JwtPayload } from "jsonwebtoken";
import { ApiResponse } from "../utils/apiResponse";
import { UserService } from "../services/UserService";
import { AppError } from "../utils/appError";
import dotenv from "dotenv";

dotenv.config();

// Instantiate UserService
const userService = new UserService();

// Tạo JWT tokens
const generateTokens = (
  id: string
): { accessToken: string; refreshToken: string } => {
  if (
    !process.env.JWT_SECRET ||
    !process.env.JWT_EXPIRES_IN ||
    !process.env.REFRESH_TOKEN_SECRET ||
    !process.env.REFRESH_TOKEN_EXPIRES_IN
  ) {
    throw new Error("JWT environment variables are not properly defined");
  }

  // Tạo access token
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN as string, 10),
  });

  // Tạo refresh token
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN as string, 10),
  });

  return { accessToken, refreshToken };
};

// Xác lập cookie
const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  // Access token cookie (thời gian ngắn hơn)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS trong production
    sameSite: "strict",
    maxAge: parseInt(process.env.JWT_EXPIRES_IN as string, 10) * 1000, // Chuyển từ giây sang milliseconds
  });

  // Refresh token cookie (thời gian dài hơn)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN as string, 10) * 1000,
  });
};

// Đăng ký người dùng mới
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, username, phone } = req.body;

    // Validate required fields
    if (!email || !password) {
      res
        .status(400)
        .json(ApiResponse.badRequest("Email và mật khẩu là bắt buộc"));
      return;
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      res
        .status(400)
        .json(
          ApiResponse.badRequest(
            "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
          )
        );
      return;
    }

    // Create user using service
    try {
      const newUser = await userService.createUser({
        fullName: name,
        email,
        password,
        username,
        phone,
      });

      // Tạo tokens
      const { accessToken, refreshToken } = generateTokens(newUser.id);

      // Loại bỏ password trước khi gửi response (not needed as getUserWithDetails already excludes password)
      const userWithDetails = await userService.getUserWithDetails(newUser.id);

      // Xác lập cookies
      setTokenCookies(res, accessToken, refreshToken);

      res.status(201).json(
        ApiResponse.created("Đăng ký tài khoản thành công", userWithDetails)
      );
    } catch (error) {
      if (error instanceof AppError) {
        res
          .status(error.statusCode)
          .json(ApiResponse.error(error.message, error.statusCode));
        return;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Đăng nhập
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra email hoặc username có tồn tại
    if (!email && !username) {
      res
        .status(400)
        .json(
          ApiResponse.badRequest("Vui lòng cung cấp email hoặc tên đăng nhập")
        );
      return;
    }

    // Kiểm tra password có tồn tại
    if (!password) {
      res
        .status(400)
        .json(ApiResponse.badRequest("Vui lòng cung cấp mật khẩu"));
      return;
    }

    // Kiểm tra user tồn tại
    let user: User | null = null;
    if (email) {
      user = await userService.findByEmail(email);
    } else if (username) {
      user = await userService.findByUsername(username);
    }

    if (!user) {
      res
        .status(401)
        .json(
          ApiResponse.unauthorized("Email hoặc tên đăng nhập không tồn tại")
        );
      return;
    }

    // Kiểm tra password chính xác
    if (!(await user.isPasswordMatch(password))) {
      res
        .status(401)
        .json(ApiResponse.unauthorized("Mật khẩu không chính xác"));
      return;
    }

    // Tạo tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Lấy thông tin chi tiết của user không bao gồm password
    const userWithDetails = await userService.getUserWithDetails(user.id);

    // Xác lập cookies
    setTokenCookies(res, accessToken, refreshToken);

    res
      .status(200)
      .json(
        ApiResponse.success("Đăng nhập thành công", userWithDetails)
      );
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json(ApiResponse.unauthorized("Không có quyền truy cập"));
      return;
    }

    const user = await userService.getUserWithDetails(req.user.id.toString());

    if (!user) {
      res.status(404).json(ApiResponse.notFound("Không tìm thấy người dùng"));
      return;
    }

    res
      .status(200)
      .json(
        ApiResponse.success("Lấy thông tin người dùng thành công", user)
      );
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin người dùng
export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json(ApiResponse.unauthorized("Không có quyền truy cập"));
      return;
    }

    const { fullName, phone, username } = req.body;

    // Validate data
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        res
          .status(400)
          .json(
            ApiResponse.badRequest(
              "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới, độ dài từ 3-30 ký tự"
            )
          );
        return;
      }
    }

    if (phone) {
      const phoneRegex = /^[0-9\+\-\s]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        res
          .status(400)
          .json(ApiResponse.badRequest("Số điện thoại không hợp lệ"));
        return;
      }
    }

    try {
      // Cập nhật thông tin người dùng
      const updatedUser = await userService.update(req.user.id.toString(), {
        fullName,
        phone,
        username,
      });

      // Lấy thông tin đầy đủ của user bao gồm role và address
      const userWithDetails = await userService.getUserWithDetails(
        updatedUser!.id
      );

      res.status(200).json(
        ApiResponse.success("Cập nhật thông tin người dùng thành công", userWithDetails)
      );
    } catch (error) {
      if (error instanceof AppError) {
        res
          .status(error.statusCode)
          .json(ApiResponse.error(error.message, error.statusCode));
        return;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Đổi mật khẩu
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user?.id) {
      res.status(401).json(ApiResponse.unauthorized("Không có quyền truy cập"));
      return;
    }

    // Validate new password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      res
        .status(400)
        .json(
          ApiResponse.badRequest(
            "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
          )
        );
      return;
    }

    try {
      // Cập nhật mật khẩu sử dụng service
      await userService.updatePassword(
        req.user.id.toString(),
        currentPassword,
        newPassword
      );

      res.status(200).json(ApiResponse.success("Đổi mật khẩu thành công"));
    } catch (error) {
      if (error instanceof AppError) {
        res
          .status(error.statusCode)
          .json(ApiResponse.error(error.message, error.statusCode));
        return;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};
