import express from 'express';
import { sendRequest, getRequests, updateRequest } from '../controllers/requestController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', verifyToken, sendRequest);
router.get('/requests', verifyToken, getRequests);
router.put('/request/:id', verifyToken, updateRequest);

export default router;