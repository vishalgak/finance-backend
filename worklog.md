# Finance Dashboard Backend API

## Overview

This project is a backend system for a Finance Dashboard application. It allows users to manage financial records, access analytics, and interact with data based on role-based permissions.

The system is designed with clean architecture, modular structure, and secure backend practices.

---

##  Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* bcrypt (Password Hashing)

### Security & Middleware

* Helmet
* CORS
* Morgan
* Express Rate Limit
* Mongo Sanitize
* XSS Clean

---

##  Architecture

The project follows a layered architecture:

* **Controllers** → Business logic
* **Routes** → API endpoints
* **Models** → Database schema
* **Middleware** → Auth, RBAC, error handling
* **Validators** → Input validation
* **Utils** → Reusable utilities

---

## 📁 Project Structure

```
src/
 ├── config/
 ├── controllers/
 ├── middleware/
 ├── models/
 ├── routes/
 ├── validators/
 ├── utils/
 ├── scripts/
 └── app.js
server.js
```

---

## Setup Instructions

### 1. Clone repository

```
git clone <your-repo-link>
cd finance-backend
```

### 2. Install dependencies

```
npm install
```

### 3. Setup environment variables

Create `.env` file:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
```

### 4. Run server

```
node server.js
```

---

## 🔐 Authentication

* JWT-based authentication
* Password hashed using bcrypt
* Token contains user id and role

---

## 👥 Role-Based Access Control (RBAC)

| Role    | Permissions                |
| ------- | -------------------------- |
| Viewer  | View dashboard only        |
| Analyst | View records + analytics   |
| Admin   | Full access (CRUD + users) |

---

## 📊 API Endpoints

### 🔑 Auth

* POST `/api/v1/auth/register`
* POST `/api/v1/auth/login`
* GET `/api/v1/auth/me`
* PUT `/api/v1/auth/change-password`

---

### 👤 Users (Admin Only)

* GET `/api/v1/users`
* GET `/api/v1/users/:id`
* PUT `/api/v1/users/:id`
* DELETE `/api/v1/users/:id`

---

### 💸 Financial Records

* POST `/api/v1/records`
* GET `/api/v1/records`
* GET `/api/v1/records/:id`
* PUT `/api/v1/records/:id`
* DELETE `/api/v1/records/:id`

---

### 📈 Dashboard APIs

* GET `/api/v1/dashboard/summary`
* GET `/api/v1/dashboard/category-breakdown`
* GET `/api/v1/dashboard/recent-activity`
* GET `/api/v1/dashboard/monthly-trends`
* GET `/api/v1/dashboard/weekly-trends`
* GET `/api/v1/dashboard/top-expenses`
* GET `/api/v1/dashboard/stats`

---

## 📊 Features

* ✅ JWT Authentication
* ✅ Role-based access control
* ✅ Financial record management
* ✅ Dashboard analytics using MongoDB aggregation
* ✅ Input validation
* ✅ Global error handling
* ✅ Rate limiting & security middleware
* ✅ Soft delete support
* ✅ Pagination & filtering

---

## ⚠️ Error Handling

* Standardized API response format
* Handles:

  * Validation errors
  * MongoDB errors
  * JWT errors
  * Not found routes

---

##  Assumptions

* Roles are predefined (Viewer, Analyst, Admin)
* Soft delete used for records instead of permanent deletion
* MongoDB is used as primary database

---

##  Enhancements (Future Scope)

* API documentation with Swagger
* Unit & integration testing
* Docker support
* Refresh tokens for auth
* Caching (Redis)

---

##  Author

Vishal Kumar
Backend Developer (Java + MERN)

---
