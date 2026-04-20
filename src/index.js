import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import requestRoutes from './routes/requests.js';
import messageRoutes from './routes/messages.js';
import ratingRoutes from './routes/ratings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', requestRoutes);
app.use('/api', messageRoutes);
app.use('/api', ratingRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));