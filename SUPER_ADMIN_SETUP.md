# Super Admin Setup Guide

This guide explains how to set up and manage the super admin account for the Remire application.

## 🚀 Automatic Setup

The super admin account is automatically created when the server starts if it doesn't already exist. This ensures that you always have access to the system.

### What Gets Created Automatically:

1. **All System Permissions** (47 permissions across 8 modules):

   - Dashboard (read, export)
   - Users (create, read, update, delete, export)
   - Orders (create, read, update, delete, approve, reject, export)
   - Payments (create, read, update, delete, approve, reject, export)
   - Forex Services (create, read, update, delete, manage)
   - Reports (read, export, create)
   - Settings (read, update, manage)
   - Staff Management (create, read, update, delete, manage)
   - Notifications (create, read, update, delete, manage)
   - Analytics (read, export, manage)

2. **Default Roles**:

   - Super Admin (Level 100) - Full access
   - Admin (Level 80) - Administrative access
   - Manager (Level 60) - Management access
   - Agent (Level 40) - Basic operational access
   - Support (Level 20) - Customer support access

3. **Super Admin Account**:
   - Email: `superadmin@remiwire.com`
   - Password: `admin123`
   - Role: `super-admin`
   - Employee ID: `SA001`
   - Full permissions to all modules

## 🔧 Manual Setup Options

### Option 1: Run the Seeding Script

```bash
cd backend
npm run seed:super-admin
```

### Option 2: Use the API Endpoint

If you already have a super admin account, you can trigger seeding via API:

```bash
POST /api/v1/admin/seed-super-admin
Authorization: Bearer <super-admin-token>
```

### Option 3: Server Auto-Seed

The server automatically runs the seeding process on startup. You'll see these logs:

```
🔍 Checking for super admin...
🌱 No super admin found. Starting auto-seed process...
📝 Creating permissions...
✅ Created 47 permissions
👥 Creating default roles...
✅ Created 5 roles
👑 Creating super admin...
✅ Super admin created successfully!
🔗 Updating references...
🎉 Auto-seed completed successfully!
```

## 🔐 Default Credentials

**Super Admin Login:**

- **Email:** `superadmin@remiwire.com`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change the password immediately after first login!

## 🛡️ Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **HTTP-Only Cookies**: Tokens stored in secure cookies
3. **Role-Based Access Control**: Granular permission system
4. **Password Hashing**: Bcrypt with salt rounds
5. **Session Management**: Secure session handling

## 📋 Available Permissions

### Dashboard Module

- `dashboard-read`: View dashboard and analytics
- `dashboard-export`: Export dashboard data

### Users Module

- `users-create`: Create new users
- `users-read`: View user information
- `users-update`: Update user information
- `users-delete`: Delete users
- `users-export`: Export user data

### Orders Module

- `orders-create`: Create new orders
- `orders-read`: View order information
- `orders-update`: Update order information
- `orders-delete`: Delete orders
- `orders-approve`: Approve orders
- `orders-reject`: Reject orders
- `orders-export`: Export order data

### Payments Module

- `payments-create`: Create payment records
- `payments-read`: View payment information
- `payments-update`: Update payment information
- `payments-delete`: Delete payment records
- `payments-approve`: Approve payments
- `payments-reject`: Reject payments
- `payments-export`: Export payment data

### Forex Services Module

- `forex-services-create`: Create forex services
- `forex-services-read`: View forex services
- `forex-services-update`: Update forex services
- `forex-services-delete`: Delete forex services
- `forex-services-manage`: Manage forex services

### Reports Module

- `reports-read`: View reports
- `reports-export`: Export reports
- `reports-create`: Create custom reports

### Settings Module

- `settings-read`: View system settings
- `settings-update`: Update system settings
- `settings-manage`: Manage system settings

### Staff Management Module

- `staff-management-create`: Create staff members
- `staff-management-read`: View staff information
- `staff-management-update`: Update staff information
- `staff-management-delete`: Delete staff members
- `staff-management-manage`: Manage staff roles and permissions

### Notifications Module

- `notifications-create`: Create notifications
- `notifications-read`: View notifications
- `notifications-update`: Update notifications
- `notifications-delete`: Delete notifications
- `notifications-manage`: Manage notification settings

### Analytics Module

- `analytics-read`: View analytics data
- `analytics-export`: Export analytics data
- `analytics-manage`: Manage analytics settings

## 🔄 Role Hierarchy

1. **Super Admin (Level 100)**

   - Full system access
   - Can manage all staff, roles, and permissions
   - Can access all modules and features

2. **Admin (Level 80)**

   - Administrative access
   - Can manage most system features
   - Limited access to system settings

3. **Manager (Level 60)**

   - Management access
   - Can manage orders, payments, and users
   - Limited administrative permissions

4. **Agent (Level 40)**

   - Basic operational access
   - Can process orders and payments
   - Limited management permissions

5. **Support (Level 20)**
   - Customer support access
   - Can view and update user information
   - Limited operational permissions

## 🚨 Troubleshooting

### Super Admin Already Exists

If you see this message:

```
Super admin already exists. Skipping seed process.
📧 Existing Super Admin: superadmin@remiwire.com
```

The system is working correctly. The super admin account already exists.

### Database Connection Issues

Make sure your MongoDB connection is working:

```bash
# Check your .env file
MONGODB_URI=mongodb://localhost:27017/remire-db
```

### Permission Issues

If you can't access certain features, check:

1. Your role level
2. Assigned permissions
3. Account status (isActive)

## 📞 Support

For issues with the super admin setup:

1. Check the server logs for error messages
2. Verify database connectivity
3. Ensure all environment variables are set
4. Run the manual seeding script if needed

## 🔄 Reset Super Admin

To reset the super admin account:

1. **Delete existing super admin:**

   ```javascript
   // In MongoDB shell
   db.staff.deleteOne({ role: "super-admin" });
   ```

2. **Restart the server** - it will auto-create the super admin

3. **Or run the seeding script:**
   ```bash
   npm run seed:super-admin
   ```

---

**Note:** This system is designed to ensure you always have administrative access to your application. The auto-seed feature runs on every server startup to guarantee system accessibility.

