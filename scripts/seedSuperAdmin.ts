import mongoose from "mongoose";
import StaffModel from "../src/modules/admin/models/Staff.model";
import PermissionModel from "../src/modules/admin/models/Permission.model";
import RoleModel from "../src/modules/admin/models/Role.model";
import { connectToDB } from "../src/config/connectToDB";

// Define all permissions for the system
const PERMISSIONS = [
  // Dashboard permissions
  {
    name: "dashboard-read",
    module: "dashboard",
    action: "read",
    description: "View dashboard and analytics",
  },
  {
    name: "dashboard-export",
    module: "dashboard",
    action: "export",
    description: "Export dashboard data",
  },

  // User management permissions
  {
    name: "users-create",
    module: "users",
    action: "create",
    description: "Create new users",
  },
  {
    name: "users-read",
    module: "users",
    action: "read",
    description: "View user information",
  },
  {
    name: "users-update",
    module: "users",
    action: "update",
    description: "Update user information",
  },
  {
    name: "users-delete",
    module: "users",
    action: "delete",
    description: "Delete users",
  },
  {
    name: "users-export",
    module: "users",
    action: "export",
    description: "Export user data",
  },

  // Order management permissions
  {
    name: "orders-create",
    module: "orders",
    action: "create",
    description: "Create new orders",
  },
  {
    name: "orders-read",
    module: "orders",
    action: "read",
    description: "View order information",
  },
  {
    name: "orders-update",
    module: "orders",
    action: "update",
    description: "Update order information",
  },
  {
    name: "orders-delete",
    module: "orders",
    action: "delete",
    description: "Delete orders",
  },
  {
    name: "orders-approve",
    module: "orders",
    action: "approve",
    description: "Approve orders",
  },
  {
    name: "orders-reject",
    module: "orders",
    action: "reject",
    description: "Reject orders",
  },
  {
    name: "orders-export",
    module: "orders",
    action: "export",
    description: "Export order data",
  },

  // Payment management permissions
  {
    name: "payments-create",
    module: "payments",
    action: "create",
    description: "Create payment records",
  },
  {
    name: "payments-read",
    module: "payments",
    action: "read",
    description: "View payment information",
  },
  {
    name: "payments-update",
    module: "payments",
    action: "update",
    description: "Update payment information",
  },
  {
    name: "payments-delete",
    module: "payments",
    action: "delete",
    description: "Delete payment records",
  },
  {
    name: "payments-approve",
    module: "payments",
    action: "approve",
    description: "Approve payments",
  },
  {
    name: "payments-reject",
    module: "payments",
    action: "reject",
    description: "Reject payments",
  },
  {
    name: "payments-export",
    module: "payments",
    action: "export",
    description: "Export payment data",
  },

  // Forex services permissions
  {
    name: "forex-services-create",
    module: "forex-services",
    action: "create",
    description: "Create forex services",
  },
  {
    name: "forex-services-read",
    module: "forex-services",
    action: "read",
    description: "View forex services",
  },
  {
    name: "forex-services-update",
    module: "forex-services",
    action: "update",
    description: "Update forex services",
  },
  {
    name: "forex-services-delete",
    module: "forex-services",
    action: "delete",
    description: "Delete forex services",
  },
  {
    name: "forex-services-manage",
    module: "forex-services",
    action: "manage",
    description: "Manage forex services",
  },

  // Reports permissions
  {
    name: "reports-read",
    module: "reports",
    action: "read",
    description: "View reports",
  },
  {
    name: "reports-export",
    module: "reports",
    action: "export",
    description: "Export reports",
  },
  {
    name: "reports-create",
    module: "reports",
    action: "create",
    description: "Create custom reports",
  },

  // Settings permissions
  {
    name: "settings-read",
    module: "settings",
    action: "read",
    description: "View system settings",
  },
  {
    name: "settings-update",
    module: "settings",
    action: "update",
    description: "Update system settings",
  },
  {
    name: "settings-manage",
    module: "settings",
    action: "manage",
    description: "Manage system settings",
  },

  // Staff management permissions
  {
    name: "staff-management-create",
    module: "staff-management",
    action: "create",
    description: "Create staff members",
  },
  {
    name: "staff-management-read",
    module: "staff-management",
    action: "read",
    description: "View staff information",
  },
  {
    name: "staff-management-update",
    module: "staff-management",
    action: "update",
    description: "Update staff information",
  },
  {
    name: "staff-management-delete",
    module: "staff-management",
    action: "delete",
    description: "Delete staff members",
  },
  {
    name: "staff-management-manage",
    module: "staff-management",
    action: "manage",
    description: "Manage staff roles and permissions",
  },

  // Notifications permissions
  {
    name: "notifications-create",
    module: "notifications",
    action: "create",
    description: "Create notifications",
  },
  {
    name: "notifications-read",
    module: "notifications",
    action: "read",
    description: "View notifications",
  },
  {
    name: "notifications-update",
    module: "notifications",
    action: "update",
    description: "Update notifications",
  },
  {
    name: "notifications-delete",
    module: "notifications",
    action: "delete",
    description: "Delete notifications",
  },
  {
    name: "notifications-manage",
    module: "notifications",
    action: "manage",
    description: "Manage notification settings",
  },

  // Analytics permissions
  {
    name: "analytics-read",
    module: "analytics",
    action: "read",
    description: "View analytics data",
  },
  {
    name: "analytics-export",
    module: "analytics",
    action: "export",
    description: "Export analytics data",
  },
  {
    name: "analytics-manage",
    module: "analytics",
    action: "manage",
    description: "Manage analytics settings",
  },
];

// Define default roles
const DEFAULT_ROLES = [
  {
    name: "Super Admin",
    description: "Full system access with all permissions",
    level: 100,
    isSystemRole: true,
  },
  {
    name: "Admin",
    description: "Administrative access with most permissions",
    level: 80,
    isSystemRole: true,
  },
  {
    name: "Manager",
    description: "Management access with limited administrative permissions",
    level: 60,
    isSystemRole: true,
  },
  {
    name: "Agent",
    description: "Basic operational access",
    level: 40,
    isSystemRole: true,
  },
  {
    name: "Support",
    description: "Customer support access",
    level: 20,
    isSystemRole: true,
  },
];

async function seedSuperAdmin() {
  try {
    // Connect to database
    await connectToDB();
    console.log("Connected to database");

    // Check if super admin already exists
    const existingSuperAdmin = await StaffModel.findOne({
      role: "super-admin",
    });
    if (existingSuperAdmin) {
      console.log("Super admin already exists. Skipping seed process.");
      console.log(`📧 Existing Super Admin: ${existingSuperAdmin.email}`);
      return;
    }

    // Create permissions
    console.log("Creating permissions...");
    const createdPermissions: any[] = [];
    for (const permissionData of PERMISSIONS) {
      const permission = new PermissionModel({
        ...permissionData,
        createdBy: new mongoose.Types.ObjectId(), // Temporary ID for seeding
      });
      await permission.save();
      createdPermissions.push(permission);
    }
    console.log(`Created ${createdPermissions.length} permissions`);

    // Create roles
    console.log("Creating roles...");
    const createdRoles: any[] = [];
    for (const roleData of DEFAULT_ROLES) {
      const role = new RoleModel({
        ...roleData,
        permissions: createdPermissions.map((p) => p._id), // All permissions for now
        createdBy: new mongoose.Types.ObjectId(), // Temporary ID for seeding
      });
      await role.save();
      createdRoles.push(role);
    }
    console.log(`Created ${createdRoles.length} roles`);

    // Create super admin staff
    console.log("Creating super admin...");
    const superAdminRole = createdRoles.find((r) => r.name === "Super Admin");
    const superAdmin = new StaffModel({
      firstname: "Super",
      lastname: "Admin",
      email: "superadmin@remiwire.com",
      password: "admin123", // Default password - should be changed on first login
      role: "super-admin",
      permissions: createdPermissions.map((p) => p._id),
      isActive: true,
      department: "IT",
      employeeId: "SA001",
      createdBy: new mongoose.Types.ObjectId(), // Self-created for seeding
    });

    await superAdmin.save();
    console.log("Super admin created successfully!");

    // Update permissions and roles with correct createdBy references
    console.log("Updating references...");
    for (const permission of createdPermissions) {
      permission.createdBy = superAdmin._id;
      await permission.save();
    }

    for (const role of createdRoles) {
      role.createdBy = superAdmin._id;
      await role.save();
    }

    superAdmin.createdBy = superAdmin._id as mongoose.Types.ObjectId;
    await superAdmin.save();

    console.log("✅ Super admin seeding completed successfully!");
    console.log("📧 Email: superadmin@remiwire.com");
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change the password after first login!");
  } catch (error) {
    console.error("❌ Error seeding super admin:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
}

// Run the seed function
if (require.main === module) {
  seedSuperAdmin()
    .then(() => {
      console.log("🎉 Seed process completed successfully!");
      console.log("===========================================");
      console.log("📧 Super Admin Email: superadmin@remiwire.com");
      console.log("🔑 Super Admin Password: admin123");
      console.log("⚠️  Please change the password after first login!");
      console.log(
        "🔐 Super Admin has full access to all modules and permissions"
      );
      console.log("===========================================");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed process failed:", error);
      process.exit(1);
    });
}

export default seedSuperAdmin;
