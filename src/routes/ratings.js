import express from 'express';
import { submitRating, getUserRatings } from '../controllers/ratingController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/rating', verifyToken, submitRating);
router.get('/ratings/:userId', verifyToken, getUserRatings);

export default router;