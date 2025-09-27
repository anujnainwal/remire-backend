import { Response } from "express";
import PermissionModel, {
  PermissionModule,
  PermissionAction,
} from "../models/Permission.model";
import RoleModel from "../models/Role.model";
import StaffModel from "../models/Staff.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import mongoose from "mongoose";

// Define module-based permissions structure
const MODULE_PERMISSIONS = {
  "User Management": ["create", "read", "update", "delete"],
  "Forex Orders": ["create", "read", "update", "delete"],
  "KYC & Compliance": ["create", "read", "update", "delete"],
  "Payments & Settlements": ["create", "read", "update", "delete"],
  "Reports & Analytics": ["create", "read", "update", "delete"],
  "Access Level": ["create", "read", "update", "delete"],
  Dashboard: ["read"], // Dashboard only has read permission
};

// Helper function to check if user is super-admin
const isSuperAdmin = async (userId: string): Promise<boolean> => {
  if (!userId || userId === "") return false;
  const staff = await StaffModel.findById(userId);
  return staff?.role === "super-admin";
};

// Helper function to get or create permissions for a module
const getOrCreateModulePermissions = async (
  moduleName: string,
  actions: string[],
  createdBy: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> => {
  const permissionIds: mongoose.Types.ObjectId[] = [];

  // Map frontend module names to backend enum values
  const moduleMapping: Record<string, PermissionModule> = {
    "User Management": "users",
    "Forex Orders": "orders",
    "KYC & Compliance": "forex-services",
    "Payments & Settlements": "payments",
    "Reports & Analytics": "reports",
    "Access Level": "staff-management",
    Dashboard: "dashboard",
  };

  const mappedModule = moduleMapping[moduleName] || "settings";

  for (const action of actions) {
    const permissionName = `${moduleName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${action}`;

    let permission = await PermissionModel.findOne({
      module: mappedModule,
      action: action as PermissionAction,
    });

    if (!permission) {
      permission = new PermissionModel({
        name: permissionName,
        module: mappedModule,
        action: action as PermissionAction,
        createdBy,
        isActive: true,
      });
      await permission.save();
    }

    permissionIds.push(permission._id as mongoose.Types.ObjectId);
  }

  return permissionIds;
};

// Create Role with Module-based Permissions
export const createRoleWithPermissions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Only super-admin can create roles");
    }

    const { name, level, permissions, isActive = true } = req.body;

    console.log("🔍 Create Role Request:", {
      name,
      level,
      permissions,
      isActive,
    });

    // Validate required fields
    if (!name || !level || !permissions) {
      return responseHelper.validationError(
        res,
        "Name, level, and permissions are required"
      );
    }

    // Prevent creation of super-admin role
    if (
      name.toLowerCase() === "super-admin" ||
      name.toLowerCase() === "superadmin"
    ) {
      return responseHelper.forbidden(
        res,
        "Super-admin role already exists and cannot be created"
      );
    }

    // Check if role already exists
    const existingRole = await RoleModel.findOne({ name });
    if (existingRole) {
      return responseHelper.error(res, "Role already exists");
    }

    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (!requestingStaff) {
      return responseHelper.error(res, "Staff not found");
    }

    // Collect all permission IDs based on module permissions
    const allPermissionIds: mongoose.Types.ObjectId[] = [];

    for (const [moduleName, modulePermissions] of Object.entries(permissions)) {
      if (modulePermissions && typeof modulePermissions === "object") {
        const enabledActions = Object.entries(modulePermissions)
          .filter(([_, enabled]) => enabled === true)
          .map(([action, _]) => action);

        if (enabledActions.length > 0) {
          const modulePermissionIds = await getOrCreateModulePermissions(
            moduleName,
            enabledActions,
            requestingStaff._id as mongoose.Types.ObjectId
          );
          allPermissionIds.push(...modulePermissionIds);
        }
      }
    }

    // Create the role
    const role = new RoleModel({
      name,
      level,
      permissions: allPermissionIds,
      isActive,
      isSystemRole: false,
      createdBy: requestingStaff._id as mongoose.Types.ObjectId,
    });

    await role.save();

    // Populate permissions for response
    await role.populate("permissions");

    return responseHelper.success(
      res,
      {
        role: {
          _id: role._id,
          name: role.name,
          level: role.level,
          permissions: role.permissions,
          isActive: role.isActive,
          isSystemRole: role.isSystemRole,
          createdAt: (role as any).createdAt,
          createdBy: role.createdBy,
        },
      },
      "Role created successfully"
    );
  } catch (error) {
    console.error("Create role error:", error);
    return responseHelper.serverError(
      res,
      `Failed to create role: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Get All Roles with Permissions
export const getAllRolesWithPermissions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Only super-admin can view roles");
    }

    const roles = await RoleModel.find({ isActive: true })
      .populate("permissions", "name module action")
      .populate("createdBy", "firstname lastname email")
      .sort({ level: -1, createdAt: -1 });

    // Transform roles to include module-based permission structure
    const transformedRoles = roles.map((role) => {
      const modulePermissions: Record<string, Record<string, boolean>> = {};

      // Initialize all modules with false permissions
      Object.keys(MODULE_PERMISSIONS).forEach((moduleName) => {
        modulePermissions[moduleName] = {};
        MODULE_PERMISSIONS[
          moduleName as keyof typeof MODULE_PERMISSIONS
        ].forEach((action) => {
          modulePermissions[moduleName][action] = false;
        });
      });

      // Set permissions based on role's permissions
      role.permissions.forEach((permission: any) => {
        const moduleName = permission.module
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
        const action = permission.action;

        if (
          modulePermissions[moduleName] &&
          modulePermissions[moduleName].hasOwnProperty(action)
        ) {
          modulePermissions[moduleName][action] = true;
        }
      });

      return {
        _id: role._id,
        name: role.name,
        level: role.level,
        permissions: modulePermissions,
        isActive: role.isActive,
        isSystemRole: role.isSystemRole,
        createdAt: (role as any).createdAt,
        createdBy: role.createdBy,
        permissionCount: role.permissions.length,
      };
    });

    return responseHelper.success(
      res,
      { roles: transformedRoles },
      "Roles retrieved successfully"
    );
  } catch (error) {
    console.error("Get roles error:", error);
    return responseHelper.serverError(res, "Failed to retrieve roles");
  }
};

// Update Role with Module-based Permissions
export const updateRoleWithPermissions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Only super-admin can update roles");
    }

    const { roleId } = req.params;
    const { name, level, permissions, isActive } = req.body;

    // Check if role exists
    const role = await RoleModel.findById(roleId);
    if (!role) {
      return responseHelper.error(res, "Role not found");
    }

    // Prevent updating system roles
    if (role.isSystemRole) {
      return responseHelper.error(res, "Cannot update system roles");
    }

    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (!requestingStaff) {
      return responseHelper.error(res, "Staff not found");
    }

    // Collect all permission IDs based on module permissions
    const allPermissionIds: mongoose.Types.ObjectId[] = [];

    if (permissions) {
      for (const [moduleName, modulePermissions] of Object.entries(
        permissions
      )) {
        if (modulePermissions && typeof modulePermissions === "object") {
          const enabledActions = Object.entries(modulePermissions)
            .filter(([_, enabled]) => enabled === true)
            .map(([action, _]) => action);

          if (enabledActions.length > 0) {
            const modulePermissionIds = await getOrCreateModulePermissions(
              moduleName,
              enabledActions,
              requestingStaff._id as mongoose.Types.ObjectId
            );
            allPermissionIds.push(...modulePermissionIds);
          }
        }
      }
    }

    // Update role
    const updateData: any = {
      updatedBy: requestingStaff._id as mongoose.Types.ObjectId,
    };

    if (name) updateData.name = name;
    if (level) updateData.level = level;
    if (permissions) updateData.permissions = allPermissionIds;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const updatedRole = await RoleModel.findByIdAndUpdate(roleId, updateData, {
      new: true,
    }).populate("permissions", "name module action description");

    return responseHelper.success(
      res,
      { role: updatedRole },
      "Role updated successfully"
    );
  } catch (error) {
    console.error("Update role error:", error);
    return responseHelper.serverError(res, "Failed to update role");
  }
};

// Delete Role
export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Only super-admin can delete roles");
    }

    const { roleId } = req.params;

    // Check if role exists
    const role = await RoleModel.findById(roleId);
    if (!role) {
      return responseHelper.error(res, "Role not found");
    }

    // Prevent deleting system roles
    if (role.isSystemRole) {
      return responseHelper.error(res, "Cannot delete system roles");
    }

    // Check if role is assigned to any staff
    const staffWithRole = await StaffModel.findOne({
      $or: [{ role: role.name }, { role: roleId }],
    });
    if (staffWithRole) {
      return responseHelper.error(
        res,
        `Cannot delete role "${role.name}" - it is assigned to staff member: ${staffWithRole.firstname} ${staffWithRole.lastname}`
      );
    }

    await RoleModel.findByIdAndDelete(roleId);

    return responseHelper.success(
      res,
      { message: "Role deleted successfully" },
      "Role deleted successfully"
    );
  } catch (error) {
    console.error("Delete role error:", error);
    return responseHelper.serverError(res, "Failed to delete role");
  }
};

// Get User Access List (Staff with their roles and permissions)
export const getUserAccessList = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(
        res,
        "Only super-admin can view user access list"
      );
    }

    const { page = 1, limit = 10, search, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter
    const filter: any = { isActive: true };

    if (search) {
      filter.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    // Get staff with pagination - optimized query
    const staff = await StaffModel.find(filter)
      .select(
        "firstname lastname email role isActive createdAt lastLogin employeeId department"
      )
      .populate("permissions", "name module action")
      .populate("createdBy", "firstname lastname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(); // Use lean() for better performance

    // Get total count
    const total = await StaffModel.countDocuments(filter);

    // Transform staff data to include module-based permissions
    const transformedStaff = staff.map((member) => {
      const modulePermissions: Record<string, Record<string, boolean>> = {};

      // Initialize all modules with false permissions
      Object.keys(MODULE_PERMISSIONS).forEach((moduleName) => {
        modulePermissions[moduleName] = {};
        MODULE_PERMISSIONS[
          moduleName as keyof typeof MODULE_PERMISSIONS
        ].forEach((action) => {
          modulePermissions[moduleName][action] = false;
        });
      });

      // Set permissions based on staff's permissions
      member.permissions.forEach((permission: any) => {
        const moduleName = permission.module
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
        const action = permission.action;

        if (
          modulePermissions[moduleName] &&
          modulePermissions[moduleName].hasOwnProperty(action)
        ) {
          modulePermissions[moduleName][action] = true;
        }
      });

      return {
        _id: member._id,
        firstname: member.firstname,
        lastname: member.lastname,
        email: member.email,
        role: member.role,
        permissions: modulePermissions,
        isActive: member.isActive,
        lastLogin: member.lastLogin,
        phoneNumber: member.phoneNumber,
        department: member.department,
        employeeId: member.employeeId,
        createdAt: (member as any).createdAt,
        createdBy: member.createdBy,
        permissionCount: member.permissions.length,
      };
    });

    // Get role statistics
    const roleStats = await StaffModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return responseHelper.success(
      res,
      {
        staff: transformedStaff,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
        roleStats,
      },
      "User access list retrieved successfully"
    );
  } catch (error) {
    console.error("Get user access list error:", error);
    return responseHelper.serverError(
      res,
      "Failed to retrieve user access list"
    );
  }
};

// Assign Role to Staff
export const assignRoleToStaff = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Only super-admin can assign roles");
    }

    const { staffId } = req.params;
    const { roleId } = req.body;

    // Check if staff exists
    const staff = await StaffModel.findById(staffId);
    if (!staff) {
      return responseHelper.error(res, "Staff member not found");
    }

    // Check if role exists
    const role = await RoleModel.findById(roleId);
    if (!role) {
      return responseHelper.error(res, "Role not found");
    }

    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (!requestingStaff) {
      return responseHelper.error(res, "Staff not found");
    }

    // Update staff role and permissions
    staff.role = role.name as any;
    staff.permissions = role.permissions;
    staff.updatedBy = requestingStaff._id as mongoose.Types.ObjectId;

    await staff.save();

    // Populate permissions for response
    await staff.populate("permissions", "name module action description");

    return responseHelper.success(res, { staff }, "Role assigned successfully");
  } catch (error) {
    console.error("Assign role error:", error);
    return responseHelper.serverError(res, "Failed to assign role");
  }
};

// Get Available Roles for Assignment
export const getAvailableRoles = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Only super-admin can view roles");
    }

    const roles = await RoleModel.find({ isActive: true })
      .select("name level isSystemRole")
      .sort({ level: -1 });

    // Filter out super-admin role from available roles
    const filteredRoles = roles.filter((role) => {
      const roleName = role.name.toLowerCase().trim();
      return (
        roleName !== "super-admin" &&
        roleName !== "superadmin" &&
        roleName !== "super_admin" &&
        roleName !== "super admin" &&
        !roleName.includes("super-admin") &&
        !roleName.includes("superadmin") &&
        !roleName.includes("super admin") &&
        !roleName.includes("super_admin")
      );
    });

    return responseHelper.success(
      res,
      { roles: filteredRoles },
      "Available roles retrieved successfully"
    );
  } catch (error) {
    console.error("Get available roles error:", error);
    return responseHelper.serverError(
      res,
      "Failed to retrieve available roles"
    );
  }
};

// Update Staff Member
export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Only super-admin can update staff");
    }

    const { staffId } = req.params;
    const updateData = req.body;

    // Prevent super-admin role assignment
    if (updateData.role === "super-admin") {
      return responseHelper.forbidden(
        res,
        "Cannot assign super-admin role. Super-admin already exists."
      );
    }

    // Check if staff exists
    const existingStaff = await StaffModel.findById(staffId);
    if (!existingStaff) {
      return responseHelper.notFound(res, "Staff member not found");
    }

    // Prevent updating super-admin accounts
    if (existingStaff.role === "super-admin") {
      return responseHelper.forbidden(
        res,
        "Cannot update super-admin accounts"
      );
    }

    // Update staff member
    const updatedStaff = await StaffModel.findByIdAndUpdate(
      staffId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedStaff) {
      return responseHelper.notFound(res, "Staff member not found");
    }

    return responseHelper.success(
      res,
      { staff: updatedStaff },
      "Staff updated successfully"
    );
  } catch (error) {
    console.error("Error updating staff:", error);
    return responseHelper.serverError(res, "Failed to update staff member");
  }
};

// Delete Staff Member
export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is super-admin
    if (!(await isSuperAdmin(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Only super-admin can delete staff");
    }

    const { staffId } = req.params;

    // Check if staff exists
    const existingStaff = await StaffModel.findById(staffId);
    if (!existingStaff) {
      return responseHelper.notFound(res, "Staff member not found");
    }

    // Prevent deleting super-admin accounts
    if (existingStaff.role === "super-admin") {
      return responseHelper.forbidden(
        res,
        "Cannot delete super-admin accounts"
      );
    }

    // Delete staff member
    await StaffModel.findByIdAndDelete(staffId);

    return responseHelper.success(res, {}, "Staff member deleted successfully");
  } catch (error) {
    console.error("Error deleting staff:", error);
    return responseHelper.serverError(res, "Failed to delete staff member");
  }
};
