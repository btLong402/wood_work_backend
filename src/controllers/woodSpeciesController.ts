import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { WoodSpeciesService } from '../services/WoodSpeciesService';

const woodSpeciesService = new WoodSpeciesService();

// Get all wood species
export const getAllWoodSpecies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const woodSpecies = await woodSpeciesService.findAll();
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách loài gỗ thành công', woodSpecies)
    );
  } catch (error) {
    next(error);
  }
};

// Get a wood species by ID
export const getWoodSpeciesById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const woodSpecies = await woodSpeciesService.findById(id);
    
    if (!woodSpecies) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy loài gỗ')
      );
      return;
    }
    
    res.status(200).json(
      ApiResponse.success('Lấy thông tin loài gỗ thành công', woodSpecies)
    );
  } catch (error) {
    next(error);
  }
};

// Create a new wood species
export const createWoodSpecies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { scientificName, commonName, conservationStatus } = req.body;
    
    const newWoodSpecies = await woodSpeciesService.createWoodSpecies({
      scientificName,
      commonName,
      conservationStatus
    });
    
    res.status(201).json(
      ApiResponse.created('Tạo loài gỗ mới thành công', newWoodSpecies)
    );
  } catch (error) {
    next(error);
  }
};

// Update a wood species
export const updateWoodSpecies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { scientificName, commonName, conservationStatus } = req.body;
    
    // Check if wood species exists
    const woodSpecies = await woodSpeciesService.findById(id);
    if (!woodSpecies) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy loài gỗ')
      );
      return;
    }
    
    // If scientific name is being changed, check for uniqueness
    if (scientificName && scientificName !== woodSpecies.scientificName) {
      const existingSpecies = await woodSpeciesService.findByScientificName(scientificName);
      if (existingSpecies) {
        res.status(400).json(
          ApiResponse.badRequest('Tên khoa học đã tồn tại cho một loài gỗ khác')
        );
        return;
      }
    }
    
    const updatedWoodSpecies = await woodSpeciesService.update(id, {
      scientificName,
      commonName,
      conservationStatus
    });
    
    res.status(200).json(
      ApiResponse.success('Cập nhật loài gỗ thành công', updatedWoodSpecies)
    );
  } catch (error) {
    next(error);
  }
};

// Delete a wood species
export const deleteWoodSpecies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if wood species exists
    const woodSpecies = await woodSpeciesService.findById(id);
    if (!woodSpecies) {
      res.status(404).json(
        ApiResponse.notFound('Không tìm thấy loài gỗ')
      );
      return;
    }
    
    await woodSpeciesService.delete(id);
    
    res.status(200).json(
      ApiResponse.success('Xóa loài gỗ thành công')
    );
  } catch (error) {
    next(error);
  }
};

// Search wood species
export const searchWoodSpecies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json(
        ApiResponse.badRequest('Từ khóa tìm kiếm không hợp lệ')
      );
      return;
    }
    
    const woodSpecies = await woodSpeciesService.searchWoodSpecies(query);
    
    res.status(200).json(
      ApiResponse.success('Tìm kiếm loài gỗ thành công', woodSpecies)
    );
  } catch (error) {
    next(error);
  }
};

// Get wood species by conservation status
export const getWoodSpeciesByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.params;
    
    if (!['Common', 'Endangered', 'Rare', 'CITES I/II'].includes(status)) {
      res.status(400).json(
        ApiResponse.badRequest('Trạng thái bảo tồn không hợp lệ')
      );
      return;
    }
    
    const woodSpecies = await woodSpeciesService.findByConservationStatus(
      status as 'Common' | 'Endangered' | 'Rare' | 'CITES I/II'
    );
    
    res.status(200).json(
      ApiResponse.success('Lấy danh sách loài gỗ theo trạng thái bảo tồn thành công', woodSpecies)
    );
  } catch (error) {
    next(error);
  }
};