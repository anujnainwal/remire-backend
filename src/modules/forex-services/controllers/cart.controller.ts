import { Request, Response } from "express";
import CartModel from "../models/Cart.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import {
  createCartItemSchema,
  updateCartItemSchema,
  updateCartSchema,
} from "../validations/cartValidation";

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    let cart = await CartModel.findOne({
      user: userId,
      status: "active",
    }).populate("user", "email firstName lastName");

    if (!cart) {
      // Create a new cart if none exists
      cart = new CartModel({
        user: userId,
        items: [],
        subtotal: 0,
        totalAmount: 0,
        currency: "INR",
        status: "active",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
      await cart.save();
    }

    return responseHelper.success(res, cart, "Cart fetched successfully");
  } catch (err) {
    console.error("Error fetching cart:", err);
    return responseHelper.serverError(res, "Failed to fetch cart");
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = createCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    let cart = await CartModel.findOne({ user: userId, status: "active" });

    if (!cart) {
      cart = new CartModel({
        user: userId,
        items: [],
        subtotal: 0,
        totalAmount: 0,
        currency: parsed.data.currency,
        status: "active",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.serviceType === parsed.data.serviceType &&
        JSON.stringify(item.metadata) === JSON.stringify(parsed.data.metadata)
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += parsed.data.quantity;
      cart.items[existingItemIndex].totalPrice =
        cart.items[existingItemIndex].quantity *
        cart.items[existingItemIndex].unitPrice;
    } else {
      // Add new item
      cart.items.push(parsed?.data as any);
    }

    // Recalculate cart totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.totalAmount = cart.subtotal + cart.taxAmount - cart.discountAmount;

    await cart.save();

    return responseHelper.success(res, cart, "Item added to cart successfully");
  } catch (err) {
    console.error("Error adding to cart:", err);
    return responseHelper.serverError(res, "Failed to add item to cart");
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { itemId } = req.params;
    const body = req.body || {};
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const cart = await CartModel.findOne({ user: userId, status: "active" });
    if (!cart) {
      return responseHelper.notFound(res, "Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id?.toString() === itemId
    );

    if (itemIndex === -1) {
      return responseHelper.notFound(res, "Cart item not found");
    }

    // Update item
    Object.assign(cart.items[itemIndex], parsed.data);

    // Recalculate total price if quantity or unit price changed
    if (parsed.data.quantity || parsed.data.unitPrice) {
      cart.items[itemIndex].totalPrice =
        cart.items[itemIndex].quantity * cart.items[itemIndex].unitPrice;
    }

    await cart.save();

    return responseHelper.success(res, cart, "Cart item updated successfully");
  } catch (err) {
    console.error("Error updating cart item:", err);
    return responseHelper.serverError(res, "Failed to update cart item");
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { itemId } = req.params;
    const cart = await CartModel.findOne({ user: userId, status: "active" });

    if (!cart) {
      return responseHelper.notFound(res, "Cart not found");
    }

    cart.items = cart.items.filter((item) => item._id?.toString() !== itemId);

    await cart.save();

    return responseHelper.success(
      res,
      cart,
      "Item removed from cart successfully"
    );
  } catch (err) {
    console.error("Error removing from cart:", err);
    return responseHelper.serverError(res, "Failed to remove item from cart");
  }
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const cart = await CartModel.findOne({ user: userId, status: "active" });

    if (!cart) {
      return responseHelper.notFound(res, "Cart not found");
    }

    cart.items = [];
    cart.subtotal = 0;
    cart.totalAmount = 0;
    cart.discountAmount = 0;
    cart.taxAmount = 0;

    await cart.save();

    return responseHelper.success(res, cart, "Cart cleared successfully");
  } catch (err) {
    console.error("Error clearing cart:", err);
    return responseHelper.serverError(res, "Failed to clear cart");
  }
};

export const updateCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = updateCartSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const cart = await CartModel.findOne({ user: userId, status: "active" });

    if (!cart) {
      return responseHelper.notFound(res, "Cart not found");
    }

    Object.assign(cart, parsed.data);
    await cart.save();

    return responseHelper.success(res, cart, "Cart updated successfully");
  } catch (err) {
    console.error("Error updating cart:", err);
    return responseHelper.serverError(res, "Failed to update cart");
  }
};

export const applyDiscountCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { discountCode } = req.body;
    const cart = await CartModel.findOne({ user: userId, status: "active" });

    if (!cart) {
      return responseHelper.notFound(res, "Cart not found");
    }

    // In a real application, you would validate the discount code against a database
    // For now, we'll use a simple mock validation
    const validDiscountCodes = {
      WELCOME10: { type: "percentage", value: 10 },
      SAVE20: { type: "percentage", value: 20 },
      FLAT500: { type: "fixed", value: 500 },
    };

    const discount =
      validDiscountCodes[discountCode as keyof typeof validDiscountCodes];

    if (!discount) {
      return responseHelper.validationError(res, "Invalid discount code");
    }

    let discountAmount = 0;
    if (discount.type === "percentage") {
      discountAmount = (cart.subtotal * discount.value) / 100;
    } else {
      discountAmount = Math.min(discount.value, cart.subtotal);
    }

    cart.discountCode = discountCode;
    cart.discountAmount = discountAmount;
    await cart.save();

    return responseHelper.success(
      res,
      cart,
      "Discount code applied successfully"
    );
  } catch (err) {
    console.error("Error applying discount code:", err);
    return responseHelper.serverError(res, "Failed to apply discount code");
  }
};

export const convertCartToOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const cart = await CartModel.findOne({ user: userId, status: "active" });

    if (!cart) {
      return responseHelper.notFound(res, "Cart not found");
    }

    if (cart.items.length === 0) {
      return responseHelper.validationError(res, "Cart is empty");
    }

    // Import OrderModel here to avoid circular dependency
    const OrderModel = (await import("../models/Order.model")).default;

    // Create orders for each cart item
    const orders = [];
    for (const item of cart.items) {
      const order = new OrderModel({
        user: userId,
        orderType: item.serviceType,
        totalAmount: item.totalPrice,
        currency: item.currency,
        metadata: item.metadata,
        trackingDetails: {
          currentStep: "order_created",
          completedSteps: ["order_created"],
          lastUpdated: new Date().toISOString(),
        },
      });
      await order.save();
      orders.push(order);
    }

    // Update cart status to converted
    cart.status = "converted";
    await cart.save();

    return responseHelper.success(
      res,
      { orders, cart },
      "Cart converted to orders successfully"
    );
  } catch (err) {
    console.error("Error converting cart to order:", err);
    return responseHelper.serverError(res, "Failed to convert cart to order");
  }
};

export const getCartAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const cart = await CartModel.findOne({ user: userId, status: "active" });

    if (!cart) {
      return responseHelper.success(
        res,
        {
          itemCount: 0,
          subtotal: 0,
          totalAmount: 0,
          currency: "INR",
          discountAmount: 0,
          taxAmount: 0,
        },
        "Cart analytics fetched successfully"
      );
    }

    const analytics = {
      itemCount: cart.items.length,
      subtotal: cart.subtotal,
      totalAmount: cart.totalAmount,
      currency: cart.currency,
      discountAmount: cart.discountAmount,
      taxAmount: cart.taxAmount,
      serviceTypes: cart.items.reduce((acc, item) => {
        acc[item.serviceType] = (acc[item.serviceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return responseHelper.success(
      res,
      analytics,
      "Cart analytics fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching cart analytics:", err);
    return responseHelper.serverError(res, "Failed to fetch cart analytics");
  }
};
