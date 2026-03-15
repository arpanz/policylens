import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import queryRoutes from './routes/query.js';
import historyRoutes from './routes/history.js';

const app = express();
app.use(cors());
app.use(express.json());        // parse JSON request bodies

app.use('/auth', authRoutes);
app.use('/api', queryRoutes);
app.use('/api', historyRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
