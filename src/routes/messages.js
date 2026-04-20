import express from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/messageController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/conversations', verifyToken, getConversations);
router.get('/messages/:otherId', verifyToken, getMessages);
router.post('/messages', verifyToken, sendMessage);

export default router;