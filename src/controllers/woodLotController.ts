import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { WoodLotService } from '../services/WoodLotService';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

const woodLotService = new WoodLotService();

// Get all wood lots
export const getAllWoodLots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const woodLots = await woodLotService.findAllWithDetails();
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách lô gỗ thành công', woodLots)
    );
  } catch (error) {
    next(error);
  }
};

// Get a wood lot by ID
export const getWoodLotById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const woodLot = await woodLotService.getWoodLotDetails(id);
    
    if (!woodLot) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy lô gỗ')
      );
      return;
    }
    
    res.status(200).json(
      ApiResponse.success('Lấy thông tin lô gỗ thành công', woodLot)
    );
  } catch (error) {
    next(error);
  }
};

// Create a new wood lot
export const createWoodLot = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { speciesId, origin, quantity, unit, quality, harvestDate } = req.body;
    
    if (!req.user?.id) {
      res.status(401).json(
        ApiResponse.unauthorized('Không có quyền truy cập')
      );
      return;
    }
    
    const newWoodLot = await woodLotService.createWoodLot({
      speciesId,
      origin,
      quantity,
      unit,
      quality,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      createdById: req.user.id
    });
    
    res.status(201).json(
      ApiResponse.created('Tạo lô gỗ mới thành công', newWoodLot)
    );
  } catch (error) {
    next(error);
  }
};

// Update a wood lot
export const updateWoodLot = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { speciesId, origin, quantity, unit, quality, harvestDate } = req.body;
    
    if (!req.user?.id) {
      res.status(401).json(
        ApiResponse.unauthorized('Không có quyền truy cập')
      );
      return;
    }
    
    // Check if wood lot exists
    const woodLot = await woodLotService.findById(id);
    if (!woodLot) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy lô gỗ')
      );
      return;
    }
    
    // Check if user is the creator of the wood lot or has admin permissions
    // This would require additional role checking logic that depends on your auth implementation
    
    const updatedWoodLot = await woodLotService.update(id, {
      speciesId,
      origin,
      quantity,
      unit,
      quality,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined
    });
    
    res.status(200).json(
      ApiResponse.success('Cập nhật lô gỗ thành công', updatedWoodLot)
    );
  } catch (error) {
    next(error);
  }
};

// Delete a wood lot
export const deleteWoodLot = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.user?.id) {
      res.status(401).json(
        ApiResponse.unauthorized('Không có quyền truy cập')
      );
      return;
    }
    
    // Check if wood lot exists
    const woodLot = await woodLotService.findById(id);
    if (!woodLot) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy lô gỗ')
      );
      return;
    }
    
    // Check if user is the creator of the wood lot or has admin permissions
    // This would require additional role checking logic
    
    await woodLotService.delete(id);
    
    res.status(200).json(
      ApiResponse.success('Xóa lô gỗ thành công')
    );
  } catch (error) {
    next(error);
  }
};

// Filter wood lots
export const filterWoodLots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      speciesId,
      quality,
      origin,
      createdById,
      harvestDateStart,
      harvestDateEnd,
      minQuantity,
      maxQuantity
    } = req.query;
    
    const filters: any = {};
    
    if (speciesId) filters.speciesId = speciesId as string;
    if (quality) filters.quality = quality as 'High' | 'Medium' | 'Low';
    if (origin) filters.origin = origin as string;
    if (createdById) filters.createdById = createdById as string;
    
    if (harvestDateStart) filters.harvestDateStart = new Date(harvestDateStart as string);
    if (harvestDateEnd) filters.harvestDateEnd = new Date(harvestDateEnd as string);
    
    if (minQuantity) filters.minQuantity = parseFloat(minQuantity as string);
    if (maxQuantity) filters.maxQuantity = parseFloat(maxQuantity as string);
    
    const woodLots = await woodLotService.filterWoodLots(filters);
    
    res.status(200).json(
      ApiResponse.success('Lọc danh sách lô gỗ thành công', woodLots)
    );
  } catch (error) {
    next(error);
  }
};

// Get wood lots by species
export const getWoodLotsBySpecies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { speciesId } = req.params;
    
    const woodLots = await woodLotService.findBySpecies(speciesId);
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách lô gỗ theo loài thành công', woodLots)
    );
  } catch (error) {
    next(error);
  }
};

// Get wood lots by creator
export const getWoodLotsByCreator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { creatorId } = req.params;
    
    const woodLots = await woodLotService.findByCreator(creatorId);
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách lô gỗ theo người tạo thành công', woodLots)
    );
  } catch (error) {
    next(error);
  }
};