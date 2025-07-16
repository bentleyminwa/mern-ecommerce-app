import express from 'express';
import {
  addToCart,
  getCartItems,
  removeFromCart,
  updateCartItem,
} from '../controllers/cart.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, getCartItems);
router.post('/', protectRoute, addToCart);
router.delete('/', protectRoute, removeFromCart);
router.put('/:id', protectRoute, updateCartItem);

export default router;
