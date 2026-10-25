# RentManager API Documentation

## Base URL

```
Production: https://api.rentmanagerke.workers.dev
Development: http://localhost:3001
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Properties](#properties-endpoints)
3. [Leases](#leases-endpoints)
4. [Payments](#payments-endpoints)
5. [Users](#users-endpoints)
6. [Dashboard](#dashboard-endpoints)
7. [Reviews](#reviews-endpoints)

---

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+254712345678",
  "role": "tenant" // or "landlord"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant",
      "createdAt": "2026-10-25T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

### Login

**POST** `/api/auth/login`

Authenticate a user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User

**GET** `/api/auth/me`

Get the currently authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+254712345678",
    "role": "tenant",
    "avatar": "https://cdn.example.com/avatars/user.jpg",
    "createdAt": "2026-10-25T10:00:00Z"
  }
}
```

---

## Properties Endpoints

### List Properties

**GET** `/api/properties`

Get a paginated list of properties.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `location` (string) - Filter by location
- `minPrice` (number) - Minimum price
- `maxPrice` (number) - Maximum price
- `bedrooms` (number) - Number of bedrooms
- `status` (string) - `available`, `occupied`, `maintenance`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "prop_xyz789",
        "title": "Modern 2BR Apartment in Kilimani",
        "description": "Spacious apartment with modern amenities",
        "price": 45000,
        "location": "Kilimani, Nairobi",
        "bedrooms": 2,
        "bathrooms": 2,
        "area": 85,
        "images": [
          "https://cdn.example.com/prop1.jpg"
        ],
        "amenities": ["parking", "wifi", "security"],
        "status": "available",
        "landlord": {
          "id": "usr_landlord1",
          "name": "Jane Smith",
          "rating": 4.5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Get Property Details

**GET** `/api/properties/:id`

Get detailed information about a specific property.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "prop_xyz789",
    "title": "Modern 2BR Apartment in Kilimani",
    "description": "Spacious apartment with modern amenities...",
    "price": 45000,
    "deposit": 45000,
    "location": "Kilimani, Nairobi",
    "coordinates": {
      "lat": -1.2884,
      "lng": 36.7817
    },
    "bedrooms": 2,
    "bathrooms": 2,
    "area": 85,
    "images": ["..."],
    "amenities": ["parking", "wifi", "security", "gym"],
    "features": ["balcony", "modern kitchen", "spacious"],
    "status": "available",
    "availableFrom": "2026-11-01",
    "landlord": {
      "id": "usr_landlord1",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+254700000000",
      "rating": 4.5,
      "reviewCount": 23
    },
    "createdAt": "2026-09-15T10:00:00Z",
    "updatedAt": "2026-10-20T15:30:00Z"
  }
}
```

### Create Property (Landlord Only)

**POST** `/api/properties`

Create a new property listing.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "title": "Modern 2BR Apartment",
  "description": "Spacious apartment...",
  "price": 45000,
  "deposit": 45000,
  "location": "Kilimani, Nairobi",
  "bedrooms": 2,
  "bathrooms": 2,
  "area": 85,
  "amenities": ["parking", "wifi"],
  "images": [<file>]
}
```

**Response:** `201 Created`

---

## Leases Endpoints

### Create Lease

**POST** `/api/leases`

Create a new lease agreement.

**Request Body:**
```json
{
  "propertyId": "prop_xyz789",
  "tenantId": "usr_tenant1",
  "startDate": "2026-11-01",
  "endDate": "2027-10-31",
  "monthlyRent": 45000,
  "deposit": 45000,
  "terms": "Standard lease terms..."
}
```

**Response:** `201 Created`

### Get Lease PDF

**GET** `/api/leases/:id/pdf`

Download lease agreement as PDF.

**Response:** `200 OK` (PDF file)

---

## Payments Endpoints

### Initiate M-Pesa Payment

**POST** `/api/payments/mpesa/stk-push`

Initiate M-Pesa STK push payment.

**Request Body:**
```json
{
  "leaseId": "lease_abc123",
  "amount": 45000,
  "phone": "+254712345678",
  "description": "Rent payment for November 2026"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "checkoutRequestId": "ws_CO_25102026104500",
    "merchantRequestId": "12345-67890-1",
    "responseCode": "0",
    "responseDescription": "Success. Request accepted for processing",
    "customerMessage": "Success. Request accepted for processing"
  }
}
```

### M-Pesa Callback (Webhook)

**POST** `/api/payments/mpesa/callback`

Receive M-Pesa payment confirmation (webhook endpoint).

### Get Payment History

**GET** `/api/payments/history`

Get payment history for the authenticated user.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string) - `pending`, `completed`, `failed`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_xyz123",
        "amount": 45000,
        "type": "rent",
        "status": "completed",
        "method": "mpesa",
        "mpesaReceiptNumber": "QGP123456",
        "phone": "+254712345678",
        "description": "Rent payment for November 2026",
        "createdAt": "2026-10-25T10:00:00Z",
        "completedAt": "2026-10-25T10:00:30Z"
      }
    ],
    "pagination": {...}
  }
}
```

### Download Receipt

**GET** `/api/payments/:id/receipt`

Download payment receipt as PDF.

**Response:** `200 OK` (PDF file)

---

## Dashboard Endpoints

### Get Dashboard Statistics

**GET** `/api/dashboard/stats`

Get dashboard statistics (role-dependent).

**Response for Landlord:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalProperties": 12,
    "occupiedUnits": 10,
    "vacantUnits": 2,
    "occupancyRate": 83.33,
    "monthlyRevenue": 450000,
    "pendingPayments": 2,
    "activeLeases": 10,
    "expiringLeases": 1
  }
}
```

### Get Revenue Analytics

**GET** `/api/dashboard/revenue`

Get revenue analytics and trends.

**Query Parameters:**
- `period` (string) - `week`, `month`, `year`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalRevenue": 450000,
    "revenueByMonth": [
      { "month": "Jan", "revenue": 420000 },
      { "month": "Feb", "revenue": 440000 }
    ],
    "revenueByProperty": [
      { "propertyId": "prop_1", "revenue": 250000 }
    ]
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

- **Anonymous users**: 100 requests per 15 minutes
- **Authenticated users**: 1000 requests per 15 minutes
- **Webhook endpoints**: No rate limit

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635174000
```

---

## Pagination

All list endpoints support pagination with the following query parameters:

- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page

Pagination response format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Webhooks

### M-Pesa Callback

RentManager receives payment confirmations from M-Pesa via webhook.

**Endpoint:** `POST /api/payments/mpesa/callback`

**Payload:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "12345-67890-1",
      "CheckoutRequestID": "ws_CO_25102026104500",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 45000
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "QGP123456"
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

---

## Testing

Use the following test credentials in development:

```
Email: test@rentmanager.com
Password: Test123!

M-Pesa Test Shortcode: 174379
M-Pesa Test Phone: 254708374149
```

---

## Support

For API support, contact: api-support@rentmanagerke.com
