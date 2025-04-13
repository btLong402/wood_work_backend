import { Op } from 'sequelize';
import { BaseService } from './BaseService';
import WoodLot from '../models/WoodLot';
import { AppError } from '../utils/appError';
import WoodSpecies from '../models/WoodSpecies';
import User from '../models/User';

export class WoodLotService extends BaseService<WoodLot> {
  constructor() {
    super(WoodLot);
  }

  /**
   * Find wood lots with related information
   */
  async findAllWithDetails(filters: any = {}): Promise<WoodLot[]> {
    return this.findAll({
      where: filters,
      include: [
        { model: WoodSpecies, as: 'species' },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });
  }

  /**
   * Get a wood lot with details
   */
  async getWoodLotDetails(id: string): Promise<WoodLot | null> {
    return this.findById(id, {
      include: [
        { model: WoodSpecies, as: 'species' },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });
  }

  /**
   * Create a wood lot with validation
   */
  async createWoodLot(data: {
    speciesId?: string;
    origin?: string;
    quantity: number;
    unit?: string;
    quality?: 'High' | 'Medium' | 'Low';
    harvestDate?: Date;
    createdById: string;
  }): Promise<WoodLot> {
    if (data.quantity <= 0) {
      throw new AppError('Số lượng phải lớn hơn 0', 400);
    }

    return this.create(data);
  }

  /**
   * Find wood lots by species
   */
  async findBySpecies(speciesId: string): Promise<WoodLot[]> {
    return this.findAll({
      where: { speciesId },
      include: [
        { model: WoodSpecies, as: 'species' }
      ]
    });
  }

  /**
   * Find wood lots by creator
   */
  async findByCreator(createdById: string): Promise<WoodLot[]> {
    return this.findAll({
      where: { createdById },
      include: [
        { model: WoodSpecies, as: 'species' }
      ]
    });
  }

  /**
   * Find wood lots by quality
   */
  async findByQuality(quality: 'High' | 'Medium' | 'Low'): Promise<WoodLot[]> {
    return this.findAll({
      where: { quality },
      include: [
        { model: WoodSpecies, as: 'species' }
      ]
    });
  }

  /**
   * Find wood lots by origin
   */
  async findByOrigin(origin: string): Promise<WoodLot[]> {
    return this.findAll({
      where: {
        origin: {
          [Op.like]: `%${origin}%`
        }
      },
      include: [
        { model: WoodSpecies, as: 'species' }
      ]
    });
  }

  /**
   * Filter wood lots based on multiple criteria
   */
  async filterWoodLots(filters: {
    speciesId?: string;
    quality?: 'High' | 'Medium' | 'Low';
    origin?: string;
    createdById?: string;
    harvestDateStart?: Date;
    harvestDateEnd?: Date;
    minQuantity?: number;
    maxQuantity?: number;
  }): Promise<WoodLot[]> {
    const where: any = {};

    if (filters.speciesId) where.speciesId = filters.speciesId;
    if (filters.quality) where.quality = filters.quality;
    if (filters.createdById) where.createdById = filters.createdById;
    
    if (filters.origin) {
      where.origin = {
        [Op.like]: `%${filters.origin}%`
      };
    }
    
    if (filters.minQuantity || filters.maxQuantity) {
      where.quantity = {};
      if (filters.minQuantity) where.quantity[Op.gte] = filters.minQuantity;
      if (filters.maxQuantity) where.quantity[Op.lte] = filters.maxQuantity;
    }
    
    if (filters.harvestDateStart || filters.harvestDateEnd) {
      where.harvestDate = {};
      if (filters.harvestDateStart) where.harvestDate[Op.gte] = filters.harvestDateStart;
      if (filters.harvestDateEnd) where.harvestDate[Op.lte] = filters.harvestDateEnd;
    }

    return this.findAll({
      where,
      include: [
        { model: WoodSpecies, as: 'species' },
        { 
          model: User, 
          as: 'creator',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });
  }
}