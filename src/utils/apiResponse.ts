/**
 * Lớp ApiResponse xử lý phản hồi API một cách nhất quán
 */
export class ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;

  constructor(statusCode: number, message: string, data: any = null) {
    this.success = statusCode < 400;
    this.message = message;
    if (data) this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success(message: string, data?: any): ApiResponse {
    return new ApiResponse(200, message, data);
  }

  static created(message: string, data?: any): ApiResponse {
    return new ApiResponse(201, message, data);
  }

  static error(message: string, statusCode: number = 500): ApiResponse {
    return new ApiResponse(statusCode, message);
  }

  static notFound(message: string = 'Resource not found'): ApiResponse {
    return new ApiResponse(404, message);
  }

  static badRequest(message: string = 'Bad request'): ApiResponse {
    return new ApiResponse(400, message);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiResponse {
    return new ApiResponse(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiResponse {
    return new ApiResponse(403, message);
  }
}