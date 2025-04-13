import { Model, ModelCtor, FindOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';
import { AppError } from '../utils/appError';

export class BaseService<T extends Model> {
  protected model: ModelCtor<T>;

  constructor(model: ModelCtor<T>) {
    this.model = model;
  }

  /**
   * Find all records with optional filters
   */
  async findAll(options?: FindOptions): Promise<T[]> {
    try {
      return await this.model.findAll(options);
    } catch (error) {
      throw new AppError(`Error finding records: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Find a record by its primary key
   */
  async findById(id: string, options?: FindOptions): Promise<T | null> {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      throw new AppError(`Error finding record: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Find one record matching the conditions
   */
  async findOne(options: FindOptions): Promise<T | null> {
    try {
      return await this.model.findOne(options);
    } catch (error) {
      throw new AppError(`Error finding record: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Create a new record
   */
  async create(data: any, options?: CreateOptions): Promise<T> {
    try {
      return await this.model.create(data, options);
    } catch (error) {
      throw new AppError(`Error creating record: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Update an existing record by id
   */
  async update(id: string, data: any, options?: UpdateOptions): Promise<T | null> {
    try {
      const record = await this.findById(id);
      if (!record) {
        throw new AppError(`Record with ID ${id} not found`, 404);
      }
      
      await record.update(data, options);
      return record;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error updating record: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Delete a record by id
   */
  async delete(id: string, options?: DestroyOptions): Promise<boolean> {
    try {
      const record = await this.findById(id);
      if (!record) {
        throw new AppError(`Record with ID ${id} not found`, 404);
      }
      
      await record.destroy(options);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error deleting record: ${(error as Error).message}`, 500);
    }
  }
}