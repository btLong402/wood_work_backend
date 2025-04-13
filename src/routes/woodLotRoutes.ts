import express from 'express';
import * as woodLotController from '../controllers/woodLotController';
import auth from '../middlewares/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', woodLotController.getAllWoodLots);
router.get('/filter', woodLotController.filterWoodLots);
router.get('/species/:speciesId', woodLotController.getWoodLotsBySpecies);
router.get('/creator/:creatorId', woodLotController.getWoodLotsByCreator);
router.get('/:id', woodLotController.getWoodLotById);

// Protected routes (authentication required)
router.post('/', auth, woodLotController.createWoodLot);
router.put('/:id', auth, woodLotController.updateWoodLot);
router.delete('/:id', auth, woodLotController.deleteWoodLot);

export default router;