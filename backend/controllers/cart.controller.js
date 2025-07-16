export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ product: productId, quantity: 1 });
    }

    await user.save();
    res.json({ message: 'Item added to cart', cart: user.cartItems });
  } catch (error) {
    console.log('Error in the addToCart controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter(
        (item) => item.product.toString() !== productId
      );
    }

    await user.save();
    res.json({ message: 'Item(s) removed from cart', cart: user.cartItems });
  } catch (error) {
    console.log('Error in the removeFromCart controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      if (quantity <= 0) {
        user.cartItems = user.cartItems.filter(
          (item) => item.product.toString() !== productId
        );
        await user.save();
        return res.json({
          message: 'Cart item removed successfully',
          cart: user.cartItems,
        });
      } else {
        existingItem.quantity = quantity;
        await user.save();
        return res.json({
          message: 'Cart item updated successfully',
          cart: user.cartItems,
        });
      }
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    console.log('Error in the updateCartItem controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
