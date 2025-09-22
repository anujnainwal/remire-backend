import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  updateCart,
  applyDiscountCode,
  convertCartToOrder,
  getCartAnalytics,
} from "../controllers/cart.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

router.use(authGuard); // All routes require authentication

// Cart operations
router.get("/cart", getCart);
router.post("/cart/items", addToCart);
router.put("/cart/items/:itemId", updateCartItem);
router.delete("/cart/items/:itemId", removeFromCart);
router.delete("/cart", clearCart);
router.put("/cart", updateCart);
router.post("/cart/apply-discount", applyDiscountCode);
router.post("/cart/convert-to-order", convertCartToOrder);
router.get("/cart/analytics", getCartAnalytics);

export default router;

