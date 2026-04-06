# Finance Dashboard Backend

## Finance Data Processing and Access Control Backend

A robust, well-structured REST API backend built with the **MERN stack** (MongoDB, Express.js, Node.js) for a finance dashboard system with role-based access control, financial record management, and summary-level analytics.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture & Design Decisions](#architecture--design-decisions)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Database Models](#database-models)
7. [Role-Based Access Control](#role-based-access-control)
8. [API Documentation](#api-documentation)
   - [Authentication](#authentication)
   - [User Management](#user-management)
   - [Financial Records](#financial-records)
   - [Dashboard Analytics](#dashboard-analytics)
9. [Error Handling](#error-handling)
10. [Validation](#validation)
11. [Assumptions & Trade-offs](#assumptions--trade-offs)
12. [Possible Enhancements](#possible-enhancements)

---

## Overview

This backend serves as the data layer for a finance dashboard application where users with different roles (Viewer, Analyst, Admin) interact with financial records. The system implements:

- **JWT-based authentication** with secure password hashing
- **Role-based access control (RBAC)** with three distinct roles
- **Full CRUD operations** on financial records with soft-delete support
- **Aggregated dashboard analytics** using MongoDB aggregation pipelines
- **Comprehensive input validation** and structured error responses
- **Rate limiting** and security middleware (Helmet, CORS, sanitization)

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express.js 4.x |
| Database | MongoDB (via Mongoose 8.x) |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Security | Helmet, CORS, express-rate-limit |
| Validation | Custom validators + validator.js |
| Logging | Morgan (HTTP request logger) |
| Environment | dotenv |

---

## Architecture & Design Decisions

### Separation of Concerns

The codebase follows a clean layered architecture:

```
Routes → Controllers → Models/Services → Database
            ↓
       Middleware (Auth, Role Check, Validation, Error Handling)
```

- **Routes** define API endpoints and attach middleware chains
- **Controllers** handle request/response logic and business rules
- **Models** define data schemas, validation, and database interactions
- **Middleware** handles cross-cutting concerns (auth, RBAC, validation, errors)

### Key Design Decisions

1. **Middleware-based RBAC**: Role permissions are enforced via reusable middleware (`authorize`, `adminOnly`, `viewerOnly`). This keeps controller logic clean and makes permission changes easy to manage in one place.

2. **Aggregation Pipeline for Analytics**: Dashboard summary endpoints use MongoDB's native aggregation framework rather than fetching all records and computing in JavaScript. This ensures efficient, database-level computation.

3. **Soft Delete**: Financial records use soft-delete (`isDeleted` flag) instead of hard deletion. A Mongoose `pre('find')` hook automatically filters out deleted records, keeping query logic transparent.

4. **Custom ApiError Class**: A structured error class provides consistent error responses with status codes, messages, and field-level validation details.

5. **Input Validation Layer**: Separate validation functions (both reusable utilities and route-specific validators) ensure clean separation between validation logic and business logic.

6. **Compound Indexes**: Strategic database indexes on frequently queried fields (`user+type`, `user+category`, `user+date`) ensure performant filtering and sorting.

---

## Project Structure

```
finance-backend/
├── server.js                          # Entry point - starts Express server
├── package.json                       # Dependencies and scripts
├── .env.example                       # Environment variable template
├── .gitignore                         # Git ignore rules
│
└── src/
    ├── app.js                         # Express app configuration and setup
    ├── config/
    │   └── db.js                      # MongoDB connection management
    │
    ├── models/
    │   ├── User.js                    # User schema with password hashing
    │   └── FinancialRecord.js         # Financial record with soft delete
    │
    ├── controllers/
    │   ├── authController.js          # Register, login, profile, password
    │   ├── userController.js          # User CRUD and management
    │   ├── recordController.js        # Financial record CRUD + filtering
    │   └── dashboardController.js     # Aggregated analytics endpoints
    │
    ├── routes/
    │   ├── auth.js                    # /api/v1/auth routes
    │   ├── users.js                   # /api/v1/users routes
    │   ├── records.js                 # /api/v1/records routes
    │   └── dashboard.js               # /api/v1/dashboard routes
    │
    ├── middleware/
    │   ├── auth.js                    # JWT token verification
    │   ├── roleCheck.js               # Role-based access control
    │   └── errorHandler.js            # Global error handler
    │
    ├── validators/
    │   ├── inputValidator.js          # Reusable validation functions
    │   ├── routeValidators.js         # Route-specific request validators
    │   └── mongoIdValidator.js        # MongoDB ObjectId validation
    │
    ├── utils/
    │   └── ApiError.js                # Custom error class
    │
    └── scripts/
        └── seed.js                    # Database seeding script
```

---

## Getting Started

### Prerequisites

- **Node.js** v16.x or later
- **MongoDB** v5.0 or later (local or remote)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd finance-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed the database with sample data (optional)
npm run seed

# Start the server in development mode
npm run dev

# Or start in production mode
npm start
```

The server will start at `http://localhost:5000`.

### Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@zorvyn.com | Admin@123 |
| Analyst | analyst@zorvyn.com | Analyst@123 |
| Viewer | viewer@zorvyn.com | Viewer@123 |
| Inactive | inactive@zorvyn.com | Inactive@123 |

---

## Database Models

### User Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | User's full name (2-50 chars) |
| email | String | Yes | Unique, lowercase email |
| password | String | Yes | Min 8 chars, hashed with bcrypt (12 salt rounds) |
| role | String | No | "viewer" (default), "analyst", or "admin" |
| status | String | No | "active" (default) or "inactive" |
| lastLogin | Date | No | Timestamp of last login |
| timestamps | Auto | - | createdAt, updatedAt |

### Financial Record Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user | ObjectId | Yes | Reference to User model |
| amount | Number | Yes | Positive number, max 2 decimal places |
| type | String | Yes | "income" or "expense" |
| category | String | Yes | Transaction category (2-50 chars) |
| date | Date | Yes | Transaction date (no future dates) |
| description | String | No | Optional notes (max 500 chars) |
| isDeleted | Boolean | No | Soft-delete flag (default: false) |
| deletedAt | Date | No | When soft-deleted |
| timestamps | Auto | - | createdAt, updatedAt |

---

## Role-Based Access Control

The system implements three roles with a clear permission hierarchy:

### Permission Matrix

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| View dashboard summaries | ✅ | ✅ | ✅ |
| View financial records | ❌ | ✅ | ✅ |
| Create financial records | ❌ | ❌ | ✅ |
| Update financial records | ❌ | ❌ | ✅ |
| Delete financial records | ❌ | ❌ | ✅ |
| View user list | ❌ | ❌ | ✅ |
| Create/manage users | ❌ | ❌ | ✅ |
| Change own password | ✅ | ✅ | ✅ |

### Implementation

RBAC is enforced via middleware that is chained on each route:

```javascript
// Example: Only admins can create records
router.post('/', authenticate, adminOnly, validateCreateRecord, recordController.createRecord);

// Example: All authenticated users can view dashboard summaries
router.get('/summary', authenticate, viewerOnly, dashboardController.getSummary);
```

The `authorize` middleware accepts variable role arguments for flexible permission checks, while convenience functions (`adminOnly`, `viewerOnly`, `analystOnly`) cover common cases.

---

## API Documentation

Base URL: `http://localhost:5000/api/v1`

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

### Authentication

#### Register a new user
```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "viewer"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "viewer",
      "status": "active",
      "roleDisplay": "Viewer"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

> **Note:** The `role` field is optional during registration. If not provided or the user doesn't have admin privileges, it defaults to "viewer".

#### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@zorvyn.com",
  "password": "Admin@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f...",
      "name": "Admin User",
      "email": "admin@zorvyn.com",
      "role": "admin",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get current user profile
```
GET /auth/me
```
**Auth Required:** ✅ Any authenticated user

#### Change password
```
PUT /auth/change-password
```
**Auth Required:** ✅ Any authenticated user

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

---

### User Management

All user management endpoints require **Admin** role.

#### Get all users
```
GET /users
```
**Auth Required:** ✅ Admin

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number |
| limit | Number | 20 | Results per page (max 100) |
| search | String | - | Search by name or email |
| role | String | - | Filter by role (viewer/analyst/admin) |
| status | String | - | Filter by status (active/inactive) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 4,
      "pages": 1
    }
  }
}
```

#### Get user by ID
```
GET /users/:userId
```
**Auth Required:** ✅ Admin

#### Update user
```
PUT /users/:userId
```
**Auth Required:** ✅ Admin

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "role": "analyst",
  "status": "inactive"
}
```

#### Delete user (soft delete)
```
DELETE /users/:userId
```
**Auth Required:** ✅ Admin

Sets user status to "inactive". The user data is preserved but the account is deactivated.

---

### Financial Records

#### Create a record
```
POST /records
```
**Auth Required:** ✅ Admin

**Request Body:**
```json
{
  "amount": 5000.50,
  "type": "expense",
  "category": "Groceries",
  "date": "2025-12-15",
  "description": "Weekly grocery shopping at BigBasket"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "record": {
      "_id": "64f...",
      "user": "64f...",
      "amount": 5000.50,
      "type": "expense",
      "category": "Groceries",
      "date": "2025-12-15T00:00:00.000Z",
      "description": "Weekly grocery shopping at BigBasket",
      "formattedAmount": "₹5,000.50",
      "createdAt": "2026-04-06T..."
    }
  }
}
```

#### Get all records
```
GET /records
```
**Auth Required:** ✅ Analyst or Admin

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number |
| limit | Number | 20 | Results per page (max 100) |
| type | String | - | Filter: "income" or "expense" |
| category | String | - | Filter by category (case-insensitive) |
| startDate | String | - | Filter from date (ISO format) |
| endDate | String | - | Filter to date (ISO format) |
| sortBy | String | date | Sort field |
| sortOrder | String | desc | Sort direction (asc/desc) |
| search | String | - | Search in description and category |
| userId | String | - | Admin only: view another user's records |

**Example:**
```
GET /records?type=expense&category=groceries&startDate=2025-01-01&endDate=2025-12-31&page=1&limit=10
```

#### Get record by ID
```
GET /records/:recordId
```
**Auth Required:** ✅ Analyst or Admin

#### Update a record
```
PUT /records/:recordId
```
**Auth Required:** ✅ Admin

**Request Body** (at least one field required):
```json
{
  "amount": 6000,
  "category": "Updated Category",
  "description": "Updated description"
}
```

#### Delete a record (soft delete)
```
DELETE /records/:recordId
```
**Auth Required:** ✅ Admin

Sets `isDeleted: true` and records the deletion timestamp. The record will no longer appear in standard queries but remains in the database.

---

### Dashboard Analytics

All dashboard endpoints require authentication. Viewers can access summary endpoints. Analysts and Admins get full access.

#### Financial summary
```
GET /dashboard/summary
```
**Auth Required:** ✅ Viewer, Analyst, Admin

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | String | Start date for filtering (ISO format) |
| endDate | String | End date for filtering (ISO format) |
| userId | String | Admin only: view another user's summary |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIncome": 350000,
    "totalExpense": 187500,
    "netBalance": 162500,
    "recordCount": 156,
    "currency": "INR"
  }
}
```

#### Category-wise breakdown
```
GET /dashboard/categories
```
**Auth Required:** ✅ Viewer, Analyst, Admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "Groceries",
        "totalIncome": 0,
        "totalExpense": 45000,
        "count": 12
      },
      {
        "_id": "Salary",
        "totalIncome": 300000,
        "totalExpense": 0,
        "count": 6
      }
    ]
  }
}
```

#### Recent activity
```
GET /dashboard/recent
```
**Auth Required:** ✅ Viewer, Analyst, Admin

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | Number | 10 | Number of recent records (1-50) |

#### Monthly trends
```
GET /dashboard/trends/monthly
```
**Auth Required:** ✅ Viewer, Analyst, Admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "month": "2025-10",
        "income": 80000,
        "expense": 32000,
        "count": 25
      },
      {
        "month": "2025-11",
        "income": 85000,
        "expense": 45000,
        "count": 30
      }
    ]
  }
}
```

#### Weekly trends
```
GET /dashboard/trends/weekly
```
**Auth Required:** ✅ Viewer, Analyst, Admin

Returns the same structure as monthly trends but grouped by ISO week.

#### Top expense categories
```
GET /dashboard/expenses/top
```
**Auth Required:** ✅ Viewer, Analyst, Admin

Returns the top 5 expense categories by total amount.

#### Dashboard stats (overview)
```
GET /dashboard/stats
```
**Auth Required:** ✅ Viewer, Analyst, Admin

Combines summary, recent records (5), and total category count in a single response. Useful for dashboard header/overview.

---

## Error Handling

All errors follow a consistent response structure:

```json
{
  "success": false,
  "status": "fail",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Specific validation error"
    }
  ]
}
```

### Error Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid token, inactive account |
| 403 | Forbidden | Insufficient role permissions |
| 404 | Not Found | Resource doesn't exist, wrong route |
| 409 | Conflict | Duplicate email, duplicate record |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server failure |

### Validation Error Example

```json
{
  "success": false,
  "status": "fail",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Please provide a valid email address" },
    { "field": "password", "message": "Password must contain at least one number" }
  ]
}
```

---

## Validation

### Input Validation Rules

| Field | Rules |
|-------|-------|
| Email | Valid email format, unique, auto-lowercased |
| Password | Min 8 chars, max 128 chars, at least 1 letter + 1 number |
| Name | String, 2-50 chars, trimmed |
| Amount | Positive number, max 2 decimal places, max value 999,999,999.99 |
| Type | Must be "income" or "expense" |
| Category | String, 2-50 chars, trimmed |
| Date | Valid date, cannot be in the future |
| Role | Must be "viewer", "analyst", or "admin" |
| Status | Must be "active" or "inactive" |
| Description | Optional, max 500 chars |

### MongoDB ObjectId Validation

All `:id` and `:userId` and `:recordId` route parameters are validated to be valid MongoDB ObjectIds before processing.

### Pagination Constraints

- Page must be a positive integer (default: 1)
- Limit must be 1-100 (default: 20)
- Sort fields restricted to whitelisted columns

---

## Assumptions & Trade-offs

### Assumptions Made

1. **Authentication Model**: JWT-based stateless authentication is used. Tokens expire after 24 hours (configurable). No refresh token mechanism is implemented — a new login is required after expiration.

2. **Role Assignment**: During registration, if a `role` is specified by a non-admin user, it is accepted as-is. In a production system, only admins should be able to assign roles.

3. **Currency**: All amounts are treated as INR (Indian Rupees). The `formattedAmount` virtual uses the `en-IN` locale for formatting.

4. **Record Ownership**: Financial records are scoped to users. Analysts and Admins can view their own records. Admins can additionally view any user's records via the `?userId=` query parameter.

5. **Date Handling**: All dates are stored and returned in UTC (ISO 8601 format). Future dates are rejected during record creation.

6. **Soft Delete**: Deleted records remain in the database with `isDeleted: true`. They are excluded from standard queries via a Mongoose pre-find hook. A hard purge mechanism is not implemented.

### Trade-offs Considered

1. **No Refresh Tokens**: Simplified the auth flow by using single JWT tokens. This means users must re-login after token expiry. This trade-off was made to keep the implementation focused and avoid the complexity of token rotation and storage.

2. **Viewers Cannot See Records**: The assignment says viewers can "only view dashboard data." I interpreted this as dashboard summary/analytics endpoints only, not individual financial records. This keeps the viewer role as the most restricted tier.

3. **Admin Creates Records Only**: Only admins can create, update, and delete financial records. Analysts can read records and view analytics but cannot modify data. This enforces a clear separation between data consumers and data managers.

4. **MongoDB Aggregation Over Application Logic**: All dashboard summary computations use MongoDB aggregation pipelines rather than JavaScript processing. This is more efficient for large datasets but makes the logic harder to unit test without a database connection.

5. **Custom Validation Over Library**: Input validation is implemented with custom validator functions rather than using a library like Joi or Zod. This provides full control and avoids an extra dependency, but Joi/Zod would offer more features like schema composition and async validation.

---

## Possible Enhancements

These are improvements that would be valuable in a production system:

1. **Refresh Token Rotation**: Implement refresh tokens for seamless session management without requiring re-login.

2. **Token Blacklisting**: Add a token blacklist (Redis-based) for immediate session invalidation (e.g., on password change or logout).

3. **Request Logging & Audit Trail**: Log all CRUD operations with user ID, timestamp, and changes made for compliance and debugging.

4. **API Rate Limiting per User**: Instead of per-IP rate limiting, implement per-user rate limiting for more granular control.

5. **File Export**: Add endpoints to export financial data as CSV or PDF reports.

6. **Search Optimization**: Implement full-text search with MongoDB text indexes for better search performance on records.

7. **WebSocket for Real-time Updates**: Push real-time dashboard updates when records are created or modified.

8. **Automated Tests**: Add unit tests (Jest) for controllers and validators, and integration tests (Supertest) for API endpoints.

9. **Swagger/OpenAPI Documentation**: Auto-generate interactive API documentation.

10. **Caching Layer**: Add Redis caching for frequently accessed dashboard summaries.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5000 | Server port |
| NODE_ENV | No | development | Environment (development/production) |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | Secret key for JWT signing |
| JWT_EXPIRES_IN | No | 24h | Token expiration time |
| RATE_LIMIT_WINDOW_MS | No | 900000 | Rate limit window (15 min) |
| RATE_LIMIT_MAX | No | 100 | Max requests per window |
| CORS_ORIGIN | No | * | Allowed CORS origins |

---

## Author

**Vishal Kumar** — Backend Developer Intern Assignment

Built for **Zorvyn FinTech Pvt. Ltd.**
