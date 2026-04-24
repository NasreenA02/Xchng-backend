import express from 'express';
import {
  getProfile, updateProfile, getAllUsers,
  getPublicProfile, getMyCompletedExchanges
} from '../controllers/profileController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/users', verifyToken, getAllUsers);
router.get('/profile/completed', verifyToken, getMyCompletedExchanges);
router.get('/user/:id', verifyToken, getPublicProfile);

export default router;