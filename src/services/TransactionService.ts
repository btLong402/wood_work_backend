import { Op } from 'sequelize';
import { BaseService } from './BaseService';
import Transaction from '../models/Transaction';
import { AppError } from '../utils/appError';
import User from '../models/User';
import WoodLot from '../models/WoodLot';
import WoodSpecies from '../models/WoodSpecies';

export class TransactionService extends BaseService<Transaction> {
  constructor() {
    super(Transaction);
  }

  /**
   * Find all transactions with related information
   */
  async findAllWithDetails(filters: any = {}): Promise<Transaction[]> {
    return this.findAll({
      where: filters,
      include: [
        { 
          model: WoodLot, 
          as: 'woodLot',
          include: [
            { model: WoodSpecies, as: 'species' }
          ]
        },
        { 
          model: User, 
          as: 'buyer',
          attributes: ['id', 'username', 'fullName', 'email']
        },
        { 
          model: User, 
          as: 'seller',
          attributes: ['id', 'username', 'fullName', 'email']
        },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });
  }

  /**
   * Get a transaction with details
   */
  async getTransactionDetails(id: string): Promise<Transaction | null> {
    return this.findById(id, {
      include: [
        { 
          model: WoodLot, 
          as: 'woodLot',
          include: [
            { model: WoodSpecies, as: 'species' }
          ]
        },
        { 
          model: User, 
          as: 'buyer',
          attributes: ['id', 'username', 'fullName', 'email']
        },
        { 
          model: User, 
          as: 'seller',
          attributes: ['id', 'username', 'fullName', 'email']
        },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data: {
    woodLotId?: string;
    buyerId?: string;
    sellerId?: string;
    price?: number;
    transactionDate?: Date;
    status?: 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
    createdById: string;
  }): Promise<Transaction> {
    // Validate price if provided
    if (data.price !== undefined && data.price <= 0) {
      throw new AppError('Giá phải lớn hơn 0', 400);
    }

    // Default status to Pending if not provided
    if (!data.status) {
      data.status = 'Pending';
    }

    // Default transaction date to current date if not provided
    if (!data.transactionDate) {
      data.transactionDate = new Date();
    }

    return this.create(data);
  }

  /**
   * Update transaction status
   */
  async updateStatus(id: string, status: 'Pending' | 'Approved' | 'Completed' | 'Cancelled', userId: string): Promise<Transaction | null> {
    const transaction = await this.findById(id);
    if (!transaction) {
      throw new AppError('Không tìm thấy giao dịch', 404);
    }

    // Add logic for status transitions if needed
    // For example, only allow certain status changes based on the current status
    
    return this.update(id, { status });
  }

  /**
   * Find transactions by buyer
   */
  async findByBuyer(buyerId: string): Promise<Transaction[]> {
    return this.findAllWithDetails({ buyerId });
  }

  /**
   * Find transactions by seller
   */
  async findBySeller(sellerId: string): Promise<Transaction[]> {
    return this.findAllWithDetails({ sellerId });
  }

  /**
   * Find transactions by wood lot
   */
  async findByWoodLot(woodLotId: string): Promise<Transaction[]> {
    return this.findAllWithDetails({ woodLotId });
  }

  /**
   * Find transactions by status
   */
  async findByStatus(status: 'Pending' | 'Approved' | 'Completed' | 'Cancelled'): Promise<Transaction[]> {
    return this.findAllWithDetails({ status });
  }

  /**
   * Filter transactions based on multiple criteria
   */
  async filterTransactions(filters: {
    woodLotId?: string;
    buyerId?: string;
    sellerId?: string;
    status?: 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
    createdById?: string;
    dateStart?: Date;
    dateEnd?: Date;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Transaction[]> {
    const where: any = {};

    // Apply filters if provided
    if (filters.woodLotId) where.woodLotId = filters.woodLotId;
    if (filters.buyerId) where.buyerId = filters.buyerId;
    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.status) where.status = filters.status;
    if (filters.createdById) where.createdById = filters.createdById;
    
    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price[Op.gte] = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price[Op.lte] = filters.maxPrice;
    }
    
    // Date range filter
    if (filters.dateStart || filters.dateEnd) {
      where.transactionDate = {};
      if (filters.dateStart) where.transactionDate[Op.gte] = filters.dateStart;
      if (filters.dateEnd) where.transactionDate[Op.lte] = filters.dateEnd;
    }

    return this.findAllWithDetails(where);
  }
}