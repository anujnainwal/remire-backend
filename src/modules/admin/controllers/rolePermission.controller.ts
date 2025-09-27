import { Request, Response } from "express";
import PermissionModel from "../models/Permission.model";
import RoleModel from "../models/Role.model";
import StaffModel from "../models/Staff.model";
import {
  permissionSchema,
  roleSchema,
  assignPermissionsSchema,
} from "../validations/staffValidation";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { manualSeedSuperAdmin } from "../../../config/autoSeed";
import mongoose from "mongoose";

// Permission Management

// Create Permission
export const createPermission = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has permission to manage permissions
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (
      !requestingStaff ||
      !["super-admin", "admin"].includes(requestingStaff.role)
    ) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const parsed = permissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { name, module, action } = parsed.data;

    // Check if permission already exists
    const existingPermission = await PermissionModel.findOne({ name });
    if (existingPermission) {
      return responseHelper.error(res, "Permission already exists");
    }

    const permission = new PermissionModel({
      name,
      module,
      action,
      createdBy: requestingStaff._id,
    });

    await permission.save();

    return responseHelper.created(
      res,
      { permission },
      "Permission created successfully"
    );
  } catch (error) {
    console.error("Create permission error:", error);
    return responseHelper.serverError(res, "Failed to create permission");
  }
};

// Get All Permissions
export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const { module, isActive } = req.query;

    const filter: any = {};
    if (module) filter.module = module;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const permissions = await PermissionModel.find(filter)
      .populate("createdBy", "firstname lastname email")
      .sort({ module: 1, action: 1 });

    return responseHelper.success(
      res,
      { permissions },
      "Permissions retrieved"
    );
  } catch (error) {
    console.error("Get permissions error:", error);
    return responseHelper.serverError(res, "Failed to retrieve permissions");
  }
};

// Update Permission
export const updatePermission = async (req: AuthRequest, res: Response) => {
  try {
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (
      !requestingStaff ||
      !["super-admin", "admin"].includes(requestingStaff.role)
    ) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { id } = req.params;
    const parsed = permissionSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const permission = await PermissionModel.findById(id);
    if (!permission) {
      return responseHelper.notFound(res, "Permission not found");
    }

    // Check if name is being changed and if it conflicts
    if (parsed.data.name && parsed.data.name !== permission.name) {
      const existingPermission = await PermissionModel.findOne({
        name: parsed.data.name,
        _id: { $ne: id },
      });
      if (existingPermission) {
        return responseHelper.error(res, "Permission name already exists");
      }
    }

    Object.assign(permission, parsed.data);
    permission.updatedBy = requestingStaff._id as mongoose.Types.ObjectId;
    await permission.save();

    return responseHelper.success(res, { permission }, "Permission updated");
  } catch (error) {
    console.error("Update permission error:", error);
    return responseHelper.serverError(res, "Failed to update permission");
  }
};

// Delete Permission
export const deletePermission = async (req: AuthRequest, res: Response) => {
  try {
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (requestingStaff?.role !== "super-admin") {
      return responseHelper.forbidden(
        res,
        "Only super-admin can delete permissions"
      );
    }

    const { id } = req.params;
    const permission = await PermissionModel.findById(id);

    if (!permission) {
      return responseHelper.notFound(res, "Permission not found");
    }

    // Check if permission is being used by any roles
    const rolesUsingPermission = await RoleModel.find({ permissions: id });
    if (rolesUsingPermission.length > 0) {
      return responseHelper.error(
        res,
        "Cannot delete permission that is assigned to roles"
      );
    }

    await PermissionModel.findByIdAndDelete(id);

    return responseHelper.success(res, null, "Permission deleted");
  } catch (error) {
    console.error("Delete permission error:", error);
    return responseHelper.serverError(res, "Failed to delete permission");
  }
};

// Role Management

// Create Role
export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (
      !requestingStaff ||
      !["super-admin", "admin"].includes(requestingStaff.role)
    ) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const parsed = roleSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { name, permissions, level } = parsed.data;

    // Check if role already exists
    const existingRole = await RoleModel.findOne({ name });
    if (existingRole) {
      return responseHelper.error(res, "Role already exists");
    }

    // Validate permissions exist
    const validPermissions = await PermissionModel.find({
      _id: { $in: permissions },
      isActive: true,
    });

    if (validPermissions.length !== permissions.length) {
      return responseHelper.error(
        res,
        "Some permissions are invalid or inactive"
      );
    }

    const role = new RoleModel({
      name,
      permissions,
      level: level || 1,
      createdBy: requestingStaff._id,
    });

    await role.save();
    await role.populate("permissions");

    return responseHelper.created(res, { role }, "Role created successfully");
  } catch (error) {
    console.error("Create role error:", error);
    return responseHelper.serverError(res, "Failed to create role");
  }
};

// Get All Roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;

    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const roles = await RoleModel.find(filter)
      .populate("permissions")
      .populate("createdBy", "firstname lastname email")
      .sort({ level: -1, name: 1 });

    return responseHelper.success(res, { roles }, "Roles retrieved");
  } catch (error) {
    console.error("Get roles error:", error);
    return responseHelper.serverError(res, "Failed to retrieve roles");
  }
};

// Update Role
export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (
      !requestingStaff ||
      !["super-admin", "admin"].includes(requestingStaff.role)
    ) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { id } = req.params;
    const parsed = roleSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const role = await RoleModel.findById(id);
    if (!role) {
      return responseHelper.notFound(res, "Role not found");
    }

    // Check if it's a system role
    if (role.isSystemRole && requestingStaff.role !== "super-admin") {
      return responseHelper.forbidden(res, "Cannot modify system roles");
    }

    // Check if name is being changed and if it conflicts
    if (parsed.data.name && parsed.data.name !== role.name) {
      const existingRole = await RoleModel.findOne({
        name: parsed.data.name,
        _id: { $ne: id },
      });
      if (existingRole) {
        return responseHelper.error(res, "Role name already exists");
      }
    }

    // Validate permissions if provided
    if (parsed.data.permissions) {
      const validPermissions = await PermissionModel.find({
        _id: { $in: parsed.data.permissions },
        isActive: true,
      });

      if (validPermissions.length !== parsed.data.permissions.length) {
        return responseHelper.error(
          res,
          "Some permissions are invalid or inactive"
        );
      }
    }

    Object.assign(role, parsed.data);
    role.updatedBy = requestingStaff._id as mongoose.Types.ObjectId;
    await role.save();
    await role.populate("permissions");

    return responseHelper.success(res, { role }, "Role updated");
  } catch (error) {
    console.error("Update role error:", error);
    return responseHelper.serverError(res, "Failed to update role");
  }
};

// Delete Role
export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (requestingStaff?.role !== "super-admin") {
      return responseHelper.forbidden(res, "Only super-admin can delete roles");
    }

    const { id } = req.params;
    const role = await RoleModel.findById(id);

    if (!role) {
      return responseHelper.notFound(res, "Role not found");
    }

    // Check if it's a system role
    if (role.isSystemRole) {
      return responseHelper.forbidden(res, "Cannot delete system roles");
    }

    // Check if role is assigned to any staff
    const staffWithRole = await StaffModel.find({ role: role.name });
    if (staffWithRole.length > 0) {
      return responseHelper.error(
        res,
        "Cannot delete role that is assigned to staff members"
      );
    }

    await RoleModel.findByIdAndDelete(id);

    return responseHelper.success(res, null, "Role deleted");
  } catch (error) {
    console.error("Delete role error:", error);
    return responseHelper.serverError(res, "Failed to delete role");
  }
};

// Assign Permissions to Staff
export const assignPermissionsToStaff = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (
      !requestingStaff ||
      !["super-admin", "admin"].includes(requestingStaff.role)
    ) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const parsed = assignPermissionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { staffId, permissions } = parsed.data;

    const staff = await StaffModel.findById(staffId);
    if (!staff) {
      return responseHelper.notFound(res, "Staff member not found");
    }

    // Validate permissions exist
    const validPermissions = await PermissionModel.find({
      _id: { $in: permissions },
      isActive: true,
    });

    if (validPermissions.length !== permissions.length) {
      return responseHelper.error(
        res,
        "Some permissions are invalid or inactive"
      );
    }

    // Update staff permissions
    staff.permissions = permissions.map((p) => new mongoose.Types.ObjectId(p));
    staff.updatedBy = requestingStaff._id as mongoose.Types.ObjectId;
    await staff.save();

    await staff.populate("permissions");

    return responseHelper.success(
      res,
      { staff },
      "Permissions assigned successfully"
    );
  } catch (error) {
    console.error("Assign permissions error:", error);
    return responseHelper.serverError(res, "Failed to assign permissions");
  }
};

// Get Staff with Permissions
export const getStaffWithPermissions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;

    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const staff = await StaffModel.find(filter)
      .populate("permissions")
      .populate("createdBy", "firstname lastname email")
      .select("-password -resetPasswordToken -resetPasswordTokenExpire")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await StaffModel.countDocuments(filter);

    return responseHelper.success(
      res,
      {
        staff,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      "Staff retrieved"
    );
  } catch (error) {
    console.error("Get staff error:", error);
    return responseHelper.serverError(res, "Failed to retrieve staff");
  }
};

// Manual Seed Super Admin (for development/admin use)
export const manualSeedSuperAdminEndpoint = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Check if user has permission to manage system
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (!requestingStaff || !requestingStaff.isActive) {
      return responseHelper.unauthorized(res, "Unauthorized access");
    }

    // Only super-admin can trigger manual seed
    if (requestingStaff.role !== "super-admin") {
      return responseHelper.forbidden(
        res,
        "Only super-admin can trigger manual seed"
      );
    }

    // Check if super admin already exists
    const existingSuperAdmin = await StaffModel.findOne({
      role: "super-admin",
    });

    if (existingSuperAdmin) {
      return responseHelper.success(
        res,
        {
          message: "Super admin already exists",
          superAdmin: {
            email: existingSuperAdmin.email,
            role: existingSuperAdmin.role,
            isActive: existingSuperAdmin.isActive,
          },
        },
        "Super admin already exists"
      );
    }

    // Run manual seed
    await manualSeedSuperAdmin();

    return responseHelper.success(
      res,
      {
        message: "Super admin seeded successfully",
        credentials: {
          email: "superadmin@remiwire.com",
          password: "admin123",
        },
      },
      "Super admin seeded successfully"
    );
  } catch (error) {
    console.error("Manual seed error:", error);
    return responseHelper.serverError(res, "Failed to seed super admin");
  }
};
