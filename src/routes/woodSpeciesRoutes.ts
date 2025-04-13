import express from 'express';
import * as woodSpeciesController from '../controllers/woodSpeciesController';
import auth from '../middlewares/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', woodSpeciesController.getAllWoodSpecies);
router.get('/search', woodSpeciesController.searchWoodSpecies);
router.get('/status/:status', woodSpeciesController.getWoodSpeciesByStatus);
router.get('/:id', woodSpeciesController.getWoodSpeciesById);

// Protected routes (authentication required)
router.post('/', auth, woodSpeciesController.createWoodSpecies);
router.put('/:id', auth, woodSpeciesController.updateWoodSpecies);
router.delete('/:id', auth, woodSpeciesController.deleteWoodSpecies);

export default router;