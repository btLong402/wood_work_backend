import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { TransactionService } from '../services/TransactionService';
import { JwtPayload } from 'jsonwebtoken';

// Extend Request interface to include user property with proper type
interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { id: string };
}

const transactionService = new TransactionService();

// Get all transactions
export const getAllTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transactions = await transactionService.findAllWithDetails();
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách giao dịch thành công', transactions)
    );
  } catch (error) {
    next(error);
  }
};

// Get a transaction by ID
export const getTransactionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionDetails(id);
    
    if (!transaction) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy giao dịch')
      );
      return;
    }
    
    res.status(200).json(
      ApiResponse.success('Lấy thông tin giao dịch thành công', transaction)
    );
  } catch (error) {
    next(error);
  }
};

// Create a new transaction
export const createTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { woodLotId, buyerId, sellerId, price, transactionDate, status } = req.body;
    
    if (!req.user?.id) {
      res.status(401).json(
        ApiResponse.unauthorized('Không có quyền truy cập')
      );
      return;
    }
    
    const newTransaction = await transactionService.createTransaction({
      woodLotId,
      buyerId,
      sellerId,
      price,
      transactionDate: transactionDate ? new Date(transactionDate) : undefined,
      status,
      createdById: req.user.id
    });
    
    res.status(201).json(
      ApiResponse.created('Tạo giao dịch mới thành công', newTransaction)
    );
  } catch (error) {
    next(error);
  }
};

// Update a transaction
export const updateTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { woodLotId, buyerId, sellerId, price, transactionDate } = req.body;
    
    if (!req.user?.id) {
      res.status(401).json(
        ApiResponse.unauthorized('Không có quyền truy cập')
      );
      return;
    }
    
    // Check if transaction exists
    const transaction = await transactionService.findById(id);
    if (!transaction) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy giao dịch')
      );
      return;
    }
    
    // Only allow updates to transactions that aren't completed or cancelled
    // This would be a business rule and might need adjustment based on your requirements
    if (transaction.status === 'Completed' || transaction.status === 'Cancelled') {
      res.status(400).json(
        ApiResponse.badRequest('Không thể cập nhật giao dịch đã hoàn thành hoặc đã hủy')
      );
      return;
    }
    
    const updatedTransaction = await transactionService.update(id, {
      woodLotId,
      buyerId,
      sellerId,
      price,
      transactionDate: transactionDate ? new Date(transactionDate) : undefined
    });
    
    res.status(200).json(
      ApiResponse.success('Cập nhật giao dịch thành công', updatedTransaction)
    );
  } catch (error) {
    next(error);
  }
};

// Update transaction status
export const updateTransactionStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!req.user?.id) {
      res.status(401).json(
        ApiResponse.unauthorized('Không có quyền truy cập')
      );
      return;
    }
    
    // Validate status
    if (!['Pending', 'Approved', 'Completed', 'Cancelled'].includes(status)) {
      res.status(400).json(
        ApiResponse.badRequest('Trạng thái giao dịch không hợp lệ')
      );
      return;
    }
    
    const updatedTransaction = await transactionService.updateStatus(
      id, 
      status as 'Pending' | 'Approved' | 'Completed' | 'Cancelled',
      req.user.id
    );
    
    if (!updatedTransaction) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy giao dịch')
      );
      return;
    }
    
    res.status(200).json(
      ApiResponse.success('Cập nhật trạng thái giao dịch thành công', updatedTransaction)
    );
  } catch (error) {
    next(error);
  }
};

// Filter transactions
export const filterTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      woodLotId,
      buyerId,
      sellerId,
      status,
      createdById,
      dateStart,
      dateEnd,
      minPrice,
      maxPrice
    } = req.query;
    
    const filters: any = {};
    
    if (woodLotId) filters.woodLotId = woodLotId as string;
    if (buyerId) filters.buyerId = buyerId as string;
    if (sellerId) filters.sellerId = sellerId as string;
    if (status) filters.status = status as 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
    if (createdById) filters.createdById = createdById as string;
    
    if (dateStart) filters.dateStart = new Date(dateStart as string);
    if (dateEnd) filters.dateEnd = new Date(dateEnd as string);
    
    if (minPrice) filters.minPrice = parseFloat(minPrice as string);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
    
    const transactions = await transactionService.filterTransactions(filters);
    
    res.status(200).json(
      ApiResponse.success('Lọc danh sách giao dịch thành công', transactions)
    );
  } catch (error) {
    next(error);
  }
};

// Get transactions by buyer
export const getTransactionsByBuyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { buyerId } = req.params;
    
    const transactions = await transactionService.findByBuyer(buyerId);
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách giao dịch theo người mua thành công', transactions)
    );
  } catch (error) {
    next(error);
  }
};

// Get transactions by seller
export const getTransactionsBySeller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sellerId } = req.params;
    
    const transactions = await transactionService.findBySeller(sellerId);
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách giao dịch theo người bán thành công', transactions)
    );
  } catch (error) {
    next(error);
  }
};

// Get transactions by status
export const getTransactionsByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.params;
    
    if (!['Pending', 'Approved', 'Completed', 'Cancelled'].includes(status)) {
      res.status(400).json(
        ApiResponse.badRequest('Trạng thái giao dịch không hợp lệ')
      );
      return;
    }
    
    const transactions = await transactionService.findByStatus(
      status as 'Pending' | 'Approved' | 'Completed' | 'Cancelled'
    );
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách giao dịch theo trạng thái thành công', transactions)
    );
  } catch (error) {
    next(error);
  }
};