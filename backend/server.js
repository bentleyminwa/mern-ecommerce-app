import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';

import { connectDB } from './lib/db.js';
import authRouter from './routes/auth.route.js';
import cartRouter from './routes/cart.route.js';
import productRouter from './routes/product.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  connectDB();
});
