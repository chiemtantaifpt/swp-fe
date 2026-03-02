# API Integration Setup

## Required Installation

First, install axios (required for API calls):

```bash
npm install axios
```

## Environment Setup

1. Create a `.env.local` file in the project root (copy from `.env.example`):
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

2. Update the `VITE_API_URL` with your actual backend URL

## Changes Made

### 1. **New Service Files**
- `src/services/api.ts` - Axios instance with JWT interceptors
- `src/services/auth.ts` - Auth service with login/register/logout functions

### 2. **Updated AuthContext** (`src/contexts/AuthContext.tsx`)
- Removed mock users
- Now calls real API via authService
- Stores JWT token in localStorage (key: `eco_token`)
- Stores user data in localStorage (key: `eco_user`)
- Added automatic token refresh on page load
- Added `loading` state to AuthContextType

### 3. **Updated Pages**
- `Login.tsx` - Better error handling, no more hardcoded test credentials
- `Register.tsx` - Added password confirmation, validation, better error handling

## API Endpoints Expected

Your backend should provide these endpoints:

### POST /api/auth/register
**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "citizen" | "enterprise" | "collector"
}
```

**Response:**
```json
{
  "accessToken": "jwt_token_string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "citizen" | "enterprise" | "collector" | "admin",
    "avatar": "string (optional)",
    "district": "string (optional)",
    "points": "number (optional)"
  }
}
```

### POST /api/auth/login
**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** (same as register)

### POST /api/auth/logout
No request body needed, needs Authorization header with token

### GET /api/auth/me
Gets current user info, needs Authorization header with token

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "citizen" | "enterprise" | "collector" | "admin",
  "avatar": "string (optional)",
  "district": "string (optional)",
  "points": "number (optional)"
}
```

## How It Works

1. **Login/Register Flow:**
   - User submits form → AuthContext calls authService → API returns token + user
   - Token saved to localStorage & automatically included in all API requests
   - User redirected to dashboard (`/${role}`)

2. **Protected Routes:**
   - ProtectedRoute component checks if token exists
   - If not authenticated, redirects to /login
   - If unauthorized role, redirects to user's own dashboard

3. **Token Expiration:**
   - Response interceptor catches 401 errors
   - Clears localStorage and redirects to /login
   - You can add refresh token logic here if needed

## Testing

See TESTING.md for testing instructions
