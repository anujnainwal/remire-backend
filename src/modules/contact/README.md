# Contact API Module

This module handles contact form submissions, email notifications, and contact message management for the Remiwire application.

## Features

- ✅ **Contact Form Submission**: Public API endpoint for contact form submissions
- ✅ **Email Notifications**: Automatic email to super admin and confirmation to customer
- ✅ **Database Storage**: All contact messages stored in MongoDB with full tracking
- ✅ **Admin Management**: Protected endpoints for managing contact messages
- ✅ **Priority System**: Automatic priority assignment based on message content
- ✅ **Status Tracking**: Track message status (new, read, replied, archived)
- ✅ **Search & Filter**: Advanced filtering and search capabilities
- ✅ **Statistics**: Contact message analytics and reporting

## API Endpoints

### Public Endpoints

#### Send Contact Message
```
POST /api/v1/contact/send-message
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry about services",
  "message": "I would like to know more about your forex services."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "64f8b2c1a1b2c3d4e5f6g7h8",
    "status": "new"
  }
}
```

### Protected Endpoints (Admin Only)

#### Get All Contact Messages
```
GET /api/v1/contact/messages?page=1&limit=10&status=new&priority=high&search=john
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (new, read, replied, archived)
- `priority`: Filter by priority (low, medium, high)
- `search`: Search in name, email, subject, or message

#### Get Contact Message by ID
```
GET /api/v1/contact/messages/:id
```

#### Update Contact Message
```
PUT /api/v1/contact/messages/:id
```

**Request Body:**
```json
{
  "status": "replied",
  "priority": "high",
  "adminNotes": "Customer inquiry about forex rates"
}
```

#### Delete Contact Message
```
DELETE /api/v1/contact/messages/:id
```

#### Get Contact Statistics
```
GET /api/v1/contact/messages/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Contact statistics retrieved successfully",
  "data": {
    "totalMessages": 150,
    "newMessages": 25,
    "todayMessages": 8,
    "statusBreakdown": [
      { "_id": "new", "count": 25 },
      { "_id": "read", "count": 100 },
      { "_id": "replied", "count": 20 },
      { "_id": "archived", "count": 5 }
    ],
    "priorityBreakdown": [
      { "_id": "low", "count": 50 },
      { "_id": "medium", "count": 80 },
      { "_id": "high", "count": 20 }
    ]
  }
}
```

## Database Schema

### ContactMessage Model

```typescript
interface IContactMessage {
  name: string;                    // Customer name
  email: string;                   // Customer email
  subject: string;                 // Message subject
  message: string;                 // Message content
  status: "new" | "read" | "replied" | "archived";
  priority: "low" | "medium" | "high";
  adminNotes?: string;             // Admin internal notes
  repliedAt?: Date;                // When message was replied to
  repliedBy?: ObjectId;            // Admin who replied
  createdAt: Date;                 // When message was created
  updatedAt: Date;                 // When message was last updated
}
```

## Email Templates

### Super Admin Notification
- **Subject**: `New Contact Message: {subject}`
- **Recipient**: Super admin email (from `SUPER_ADMIN_EMAIL` env var)
- **Content**: Professional HTML email with message details, priority badge, and reply button

### Customer Confirmation
- **Subject**: `Thank you for contacting Remiwire`
- **Recipient**: Customer email
- **Content**: Confirmation message with their original message details

## Environment Variables

Add these to your `.env` file:

```env
# Super Admin Email (where contact messages are sent)
SUPER_ADMIN_EMAIL=admin@remiwire.com

# Email Configuration (already configured)
EMAIL_PROVIDER=smtp
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
EMAIL_FROM=noreply@remiwire.com
```

## Priority System

Messages are automatically assigned priority based on keywords:

### High Priority
- Keywords: "urgent", "asap", "emergency", "critical", "immediate"
- Color: Red badge in email

### Low Priority
- Keywords: "question", "inquiry", "info", "information"
- Color: Green badge in email

### Medium Priority
- Default for all other messages
- Color: Yellow badge in email

## Usage Examples

### Frontend Integration

```typescript
// Send contact message
const sendContactMessage = async (formData: ContactFormData) => {
  const response = await fetch('/api/v1/contact/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  
  return response.json();
};

// Get messages (admin)
const getContactMessages = async (filters: MessageFilters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/contact/messages?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};
```

### Admin Dashboard Integration

```typescript
// Update message status
const updateMessageStatus = async (messageId: string, updates: MessageUpdates) => {
  const response = await fetch(`/api/v1/contact/messages/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  
  return response.json();
};
```

## Security Features

- ✅ **Input Validation**: Comprehensive validation using express-validator
- ✅ **XSS Protection**: HTML escaping for user input
- ✅ **Rate Limiting**: Can be added via middleware
- ✅ **Authentication**: Protected admin endpoints require valid JWT token
- ✅ **Email Sanitization**: Email normalization and validation

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found (message not found)
- `500`: Internal Server Error

## Monitoring & Logging

- All contact submissions are logged
- Email sending failures are logged but don't fail the request
- Database operations are logged for debugging
- Admin actions are tracked with timestamps

## Future Enhancements

- [ ] Email templates customization via admin panel
- [ ] Auto-reply system based on keywords
- [ ] Contact form analytics dashboard
- [ ] Integration with CRM systems
- [ ] Bulk message operations
- [ ] Message templates for common responses
