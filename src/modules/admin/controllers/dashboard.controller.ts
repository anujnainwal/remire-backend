import { Request, Response } from "express";
import { responseHelper } from "../../../utils/responseHelper";
import UserModel from "../../users/models/User.model";
import StaffModel from "../models/Staff.model";
import OrderModel from "../../forex-services/models/Order.model";

// Interface for dashboard metrics
interface DashboardMetrics {
  totalUsers: number;
  totalActiveUsers: number;
  userBreakdown: {
    customers: number;
    staff: number;
  };
  totalOrders: number;
  totalPendingOrders: number;
  orderBreakdown: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    failed: number;
  };
  recentActivity: {
    newUsersToday: number;
    newOrdersToday: number;
    completedOrdersToday: number;
  };
}

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    // Get total users (customers only)
    const totalCustomers = await UserModel.countDocuments();
    
    // Get total staff
    const totalStaff = await StaffModel.countDocuments();
    
    // Get active customers (isActive: true, isBlocked: false)
    const activeCustomers = await UserModel.countDocuments({
      isActive: true,
      isBlocked: false,
    });
    
    // Get active staff
    const activeStaff = await StaffModel.countDocuments({
      isActive: true,
    });
    
    // Get total orders
    const totalOrders = await OrderModel.countDocuments();
    
    // Get pending orders
    const totalPendingOrders = await OrderModel.countDocuments({
      status: "pending",
    });
    
    // Get order breakdown by status
    const orderBreakdown = await OrderModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Convert array to object
    const orderStatusCounts = orderBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Get today's activity
    const newUsersToday = await UserModel.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    
    const newOrdersToday = await OrderModel.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    
    const completedOrdersToday = await OrderModel.countDocuments({
      status: "completed",
      updatedAt: { $gte: startOfDay, $lte: endOfDay },
    });
    
    // Calculate total active users (customers + staff)
    const totalActiveUsers = activeCustomers + activeStaff;
    
    // Prepare response
    const metrics: DashboardMetrics = {
      totalUsers: totalCustomers + totalStaff,
      totalActiveUsers,
      userBreakdown: {
        customers: totalCustomers,
        staff: totalStaff,
      },
      totalOrders,
      totalPendingOrders,
      orderBreakdown: {
        pending: orderStatusCounts.pending || 0,
        processing: orderStatusCounts.processing || 0,
        completed: orderStatusCounts.completed || 0,
        cancelled: orderStatusCounts.cancelled || 0,
        failed: orderStatusCounts.failed || 0,
      },
      recentActivity: {
        newUsersToday,
        newOrdersToday,
        completedOrdersToday,
      },
    };
    
    return responseHelper.success(
      res,
      metrics,
      "Dashboard metrics retrieved successfully"
    );
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return responseHelper.serverError(res, "Failed to retrieve dashboard metrics");
  }
};

// Get detailed analytics for charts and graphs
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = "30d" } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get user registration trends
    const userTrends = await UserModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);
    
    // Get order trends
    const orderTrends = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);
    
    // Get order type distribution
    const orderTypeDistribution = await OrderModel.aggregate([
      {
        $group: {
          _id: "$orderType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);
    
    // Get top performing staff (by orders handled)
    const topStaff = await StaffModel.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "assignedAgent",
          as: "orders",
        },
      },
      {
        $project: {
          firstname: 1,
          lastname: 1,
          email: 1,
          role: 1,
          orderCount: { $size: "$orders" },
        },
      },
      {
        $sort: { orderCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    
    return responseHelper.success(
      res,
      {
        period,
        userTrends,
        orderTrends,
        orderTypeDistribution,
        topStaff,
      },
      "Dashboard analytics retrieved successfully"
    );
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return responseHelper.serverError(res, "Failed to retrieve dashboard analytics");
  }
};
