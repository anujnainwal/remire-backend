# Staff Access Level Management API

This document describes the API endpoints for managing staff access levels, roles, and permissions in the Remire application.

## Base URL
```
/api/v1/admin/access
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header or HTTP-only cookies. Only users with `super-admin` role can access these endpoints.

## Endpoints

### 1. Role Management

#### Create Role with Module-based Permissions
```http
POST /api/v1/admin/access/roles
```

**Request Body:**
```json
{
  "name": "Custom Manager",
  "level": 65,
  "permissions": {
    "User Management": {
      "create": true,
      "read": true,
      "update": true,
      "delete": false
    },
    "Forex Orders": {
      "create": true,
      "read": true,
      "update": false,
      "delete": false
    },
    "Dashboard": {
      "read": true
    }
  },
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "role": {
      "_id": "64f8b2c1a1b2c3d4e5f6g7h8",
      "name": "Custom Manager",
      "level": 65,
      "permissions": [...],
      "isActive": true,
      "isSystemRole": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "createdBy": "64f8b2c1a1b2c3d4e5f6g7h9"
    }
  }
}
```

#### Get All Roles with Permissions
```http
GET /api/v1/admin/access/roles
```

**Response:**
```json
{
  "success": true,
  "message": "Roles retrieved successfully",
  "data": {
    "roles": [
      {
        "_id": "64f8b2c1a1b2c3d4e5f6g7h8",
        "name": "Super Admin",
        "level": 100,
        "permissions": {
          "User Management": {
            "create": true,
            "read": true,
            "update": true,
            "delete": true
          },
          "Forex Orders": {
            "create": true,
            "read": true,
            "update": true,
            "delete": true
          }
        },
        "isActive": true,
        "isSystemRole": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "createdBy": {
          "_id": "64f8b2c1a1b2c3d4e5f6g7h9",
          "firstname": "System",
          "lastname": "Admin",
          "email": "system@remire.com"
        },
        "permissionCount": 47
      }
    ]
  }
}
```

#### Update Role with Module-based Permissions
```http
PUT /api/v1/admin/access/roles/:roleId
```

**Request Body:**
```json
{
  "name": "Updated Manager",
  "level": 70,
  "permissions": {
    "User Management": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    }
  },
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "role": {
      "_id": "64f8b2c1a1b2c3d4e5f6g7h8",
      "name": "Updated Manager",
      "level": 70,
      "permissions": [...],
      "isActive": true,
      "isSystemRole": false,
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

#### Delete Role
```http
DELETE /api/v1/admin/access/roles/:roleId
```

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully",
  "data": {
    "message": "Role deleted successfully"
  }
}
```

#### Get Available Roles for Assignment
```http
GET /api/v1/admin/access/roles/available
```

**Response:**
```json
{
  "success": true,
  "message": "Available roles retrieved successfully",
  "data": {
    "roles": [
      {
        "_id": "64f8b2c1a1b2c3d4e5f6g7h8",
        "name": "Manager",
        "level": 60,
        "description": "Manager role with moderate permissions",
        "isSystemRole": true
      }
    ]
  }
}
```

### 2. User Access Management

#### Get User Access List
```http
GET /api/v1/admin/access/users
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name, email, or employee ID
- `role` (optional): Filter by role (super-admin, admin, manager, agent, support)

**Example:**
```http
GET /api/v1/admin/access/users?page=1&limit=10&search=john&role=manager
```

**Response:**
```json
{
  "success": true,
  "message": "User access list retrieved successfully",
  "data": {
    "staff": [
      {
        "_id": "64f8b2c1a1b2c3d4e5f6g7h8",
        "firstname": "John",
        "lastname": "Doe",
        "email": "john.doe@remire.com",
        "role": "manager",
        "permissions": {
          "User Management": {
            "create": true,
            "read": true,
            "update": true,
            "delete": false
          }
        },
        "isActive": true,
        "lastLogin": "2024-01-15T09:30:00.000Z",
        "phoneNumber": "+1234567890",
        "department": "Operations",
        "employeeId": "EMP001",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "createdBy": {
          "_id": "64f8b2c1a1b2c3d4e5f6g7h9",
          "firstname": "Admin",
          "lastname": "User",
          "email": "admin@remire.com"
        },
        "permissionCount": 15
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    },
    "roleStats": [
      {
        "_id": "agent",
        "count": 25
      },
      {
        "_id": "manager",
        "count": 10
      },
      {
        "_id": "admin",
        "count": 5
      }
    ]
  }
}
```

#### Assign Role to Staff
```http
POST /api/v1/admin/access/users/:staffId/assign-role
```

**Request Body:**
```json
{
  "roleId": "64f8b2c1a1b2c3d4e5f6g7h8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role assigned successfully",
  "data": {
    "staff": {
      "_id": "64f8b2c1a1b2c3d4e5f6g7h8",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john.doe@remire.com",
      "role": "manager",
      "permissions": [...],
      "isActive": true,
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

## Available Modules and Permissions

The system supports the following modules with their respective CRUD operations:

### 1. User Management
- **create**: Create new users
- **read**: View user information
- **update**: Modify user details
- **delete**: Remove users

### 2. Forex Orders
- **create**: Create new forex orders
- **read**: View forex orders
- **update**: Modify forex orders
- **delete**: Cancel/delete forex orders

### 3. KYC & Compliance
- **create**: Create KYC records
- **read**: View KYC information
- **update**: Update KYC status
- **delete**: Remove KYC records

### 4. Payments & Settlements
- **create**: Process payments
- **read**: View payment records
- **update**: Modify payment details
- **delete**: Cancel payments

### 5. Reports & Analytics
- **create**: Generate reports
- **read**: View reports
- **update**: Modify report settings
- **delete**: Remove reports

### 6. Access Level
- **create**: Create new roles
- **read**: View role information
- **update**: Modify role permissions
- **delete**: Remove roles

### 7. Dashboard
- **read**: View dashboard data

## Error Responses

### 403 Forbidden
```json
{
  "success": false,
  "message": "Only super-admin can create roles",
  "error": "FORBIDDEN"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Name, level, and permissions are required",
  "error": "VALIDATION_ERROR"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Role not found",
  "error": "NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create role",
  "error": "INTERNAL_SERVER_ERROR"
}
```

## Security Features

1. **Super Admin Only**: All endpoints are restricted to super-admin users
2. **System Role Protection**: System roles (Super Admin, Admin, Manager, Agent, Support) cannot be deleted or have their core properties modified
3. **Permission Validation**: All permission assignments are validated against the module structure
4. **Audit Trail**: All role and permission changes are tracked with createdBy/updatedBy fields
5. **JWT Authentication**: Secure token-based authentication with HTTP-only cookies

## Usage Examples

### Frontend Integration

```typescript
import { staffAccessLevelApi } from '@/services/staffAccessLevelApi';

// Create a new role
const newRole = await staffAccessLevelApi.createRole({
  name: "Custom Manager",
  level: 65,
  permissions: {
    "User Management": {
      create: true,
      read: true,
      update: true,
      delete: false
    },
    "Dashboard": {
      read: true
    }
  },
  isActive: true
});

// Get all roles
const roles = await staffAccessLevelApi.getAllRoles();

// Assign role to staff
await staffAccessLevelApi.assignRoleToStaff(staffId, roleId);

// Get user access list with pagination
const users = await staffAccessLevelApi.getUserAccessList({
  page: 1,
  limit: 10,
  search: "john",
  role: "manager"
});
```

## Notes

- All timestamps are in ISO 8601 format
- Permission objects are automatically created when roles are created/updated
- The system prevents deletion of roles that are currently assigned to staff members
- Super Admin role is protected and cannot be modified or deleted
- All API responses follow a consistent structure with success/error indicators

