import express from 'express';
import * as userController from '../controllers/userController';
import auth, { refreshAuth, clearTokens } from '../middlewares/auth';

const router = express.Router();

// Route công khai
router.post('/register', userController.register);
router.post('/login', userController.login);

// Refresh token route
router.post('/refresh-token', refreshAuth, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Access token đã được làm mới thành công'
  });
});

// Đăng xuất
router.post('/logout', (req, res) => {
  clearTokens(req, res);
  res.status(200).json({
    status: 'success',
    message: 'Đăng xuất thành công'
  });
});

// Route có xác thực
router.get('/profile', auth, userController.getCurrentUser);
router.put('/profile', auth, userController.updateUserProfile);
router.put('/change-password', auth, userController.changePassword);

export default router;