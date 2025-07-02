import dotenv from 'dotenv';
import express from 'express';

import { connectDB } from './lib/db.js';
import { authRouter } from './routes/auth.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.use('/api/auth', authRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    connectDB();
});
