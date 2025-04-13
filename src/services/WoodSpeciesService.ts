import { Op } from 'sequelize';
import { BaseService } from './BaseService';
import WoodSpecies from '../models/WoodSpecies';
import { AppError } from '../utils/appError';

export class WoodSpeciesService extends BaseService<WoodSpecies> {
  constructor() {
    super(WoodSpecies);
  }

  /**
   * Find wood species by scientific name
   */
  async findByScientificName(scientificName: string): Promise<WoodSpecies | null> {
    return this.findOne({ where: { scientificName } });
  }

  /**
   * Find wood species by common name
   */
  async findByCommonName(commonName: string): Promise<WoodSpecies[]> {
    return this.findAll({
      where: {
        commonName: {
          [Op.like]: `%${commonName}%`
        }
      }
    });
  }

  /**
   * Create a new wood species with validation
   */
  async createWoodSpecies(data: {
    scientificName: string;
    commonName?: string;
    conservationStatus?: 'Common' | 'Endangered' | 'Rare' | 'CITES I/II';
  }): Promise<WoodSpecies> {
    // Check if scientific name already exists
    const existing = await this.findByScientificName(data.scientificName);
    if (existing) {
      throw new AppError('Loài gỗ với tên khoa học này đã tồn tại', 400);
    }

    return this.create(data);
  }

  /**
   * Find wood species by conservation status
   */
  async findByConservationStatus(status: 'Common' | 'Endangered' | 'Rare' | 'CITES I/II'): Promise<WoodSpecies[]> {
    return this.findAll({
      where: { conservationStatus: status }
    });
  }

  /**
   * Search wood species by name (scientific or common)
   */
  async searchWoodSpecies(query: string): Promise<WoodSpecies[]> {
    return this.findAll({
      where: {
        [Op.or]: [
          { scientificName: { [Op.like]: `%${query}%` } },
          { commonName: { [Op.like]: `%${query}%` } }
        ]
      }
    });
  }
}