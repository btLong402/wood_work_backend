import express from 'express';
import * as transactionController from '../controllers/transactionController';
import auth from '../middlewares/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', transactionController.getAllTransactions);
router.get('/filter', transactionController.filterTransactions);
router.get('/buyer/:buyerId', transactionController.getTransactionsByBuyer);
router.get('/seller/:sellerId', transactionController.getTransactionsBySeller);
router.get('/status/:status', transactionController.getTransactionsByStatus);
router.get('/:id', transactionController.getTransactionById);

// Protected routes (authentication required)
router.post('/', auth, transactionController.createTransaction);
router.put('/:id', auth, transactionController.updateTransaction);
router.patch('/:id/status', auth, transactionController.updateTransactionStatus);

export default router;