import { Request, Response } from "express";
import OrderModel from "../models/Order.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import {
  createOrderSchema,
  updateOrderSchema,
} from "../validations/orderValidation";

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const {
      orderType,
      totalAmount,
      currency,
      metadata,
      paymentDetails,
      trackingDetails,
      assignedAgent,
      notes,
    } = parsed.data;

    const order = new OrderModel({
      user: userId,
      orderType,
      totalAmount,
      currency,
      metadata,
      paymentDetails: paymentDetails || {},
      trackingDetails: trackingDetails || {
        currentStep: "order_created",
        completedSteps: ["order_created"],
        lastUpdated: new Date().toISOString(),
      },
      assignedAgent,
      notes,
    });

    await order.save();

    return responseHelper.created(res, order, "Order created successfully");
  } catch (err) {
    console.error("Error creating order:", err);
    return responseHelper.serverError(res, "Failed to create order");
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { page = 1, limit = 10, status, orderType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { user: userId };
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "email firstName lastName");

    const total = await OrderModel.countDocuments(filter);

    return responseHelper.success(
      res,
      {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      "Orders fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching orders:", err);
    return responseHelper.serverError(res, "Failed to fetch orders");
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const order = await OrderModel.findOne({
      _id: id,
      user: userId,
    }).populate("user", "email firstname lastname");

    if (!order) {
      return responseHelper.notFound(res, "Order not found");
    }

    return responseHelper.success(res, order, "Order fetched successfully");
  } catch (err) {
    console.error("Error fetching order:", err);
    return responseHelper.serverError(res, "Failed to fetch order");
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const body = req.body || {};
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const updateData = { ...parsed.data };
    if (updateData.trackingDetails) {
      updateData.trackingDetails.lastUpdated = new Date().toISOString();
    }

    const order = await OrderModel.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true }
    );

    if (!order) {
      return responseHelper.notFound(res, "Order not found");
    }

    return responseHelper.success(res, order, "Order updated successfully");
  } catch (err) {
    console.error("Error updating order:", err);
    return responseHelper.serverError(res, "Failed to update order");
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const order = await OrderModel.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!order) {
      return responseHelper.notFound(res, "Order not found");
    }

    return responseHelper.success(res, null, "Order deleted successfully");
  } catch (err) {
    console.error("Error deleting order:", err);
    return responseHelper.serverError(res, "Failed to delete order");
  }
};

export const getOrderByOrderNumber = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { orderNumber } = req.params;
    const order = await OrderModel.findOne({
      orderNumber,
      user: userId,
    }).populate("user", "email firstName lastName");

    if (!order) {
      return responseHelper.notFound(res, "Order not found");
    }

    return responseHelper.success(res, order, "Order fetched successfully");
  } catch (err) {
    console.error("Error fetching order by order number:", err);
    return responseHelper.serverError(res, "Failed to fetch order");
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const { status, paymentStatus, kycStatus } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (kycStatus) updateData.kycStatus = kycStatus;

    updateData.trackingDetails = {
      lastUpdated: new Date().toISOString(),
    };

    const order = await OrderModel.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true }
    );

    if (!order) {
      return responseHelper.notFound(res, "Order not found");
    }

    return responseHelper.success(
      res,
      order,
      "Order status updated successfully"
    );
  } catch (err) {
    console.error("Error updating order status:", err);
    return responseHelper.serverError(res, "Failed to update order status");
  }
};

export const getOrderAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const analytics = await OrderModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          failedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
        },
      },
    ]);

    const orderTypeAnalytics = await OrderModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$orderType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    return responseHelper.success(
      res,
      {
        overview: analytics[0] || {
          totalOrders: 0,
          totalAmount: 0,
          pendingOrders: 0,
          completedOrders: 0,
          failedOrders: 0,
        },
        byOrderType: orderTypeAnalytics,
      },
      "Order analytics fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching order analytics:", err);
    return responseHelper.serverError(res, "Failed to fetch order analytics");
  }
};
