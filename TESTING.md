# How to Test the API Integration

## Prerequisites

1. **Install axios:**
   ```bash
   npm install axios
   ```

2. **Create `.env.local` file:**
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Backend must be running** on http://localhost:3000

## Testing Methods

### Option 1: Using Postman / REST Client

#### 1. Register (POST)
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "role": "citizen"
}
```
**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "role": "citizen"
  }
}
```

#### 2. Login (POST)
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
**Expected Response (200):** Same as register

#### 3. Get Current User (GET)
```
GET http://localhost:3000/api/auth/me
Authorization: Bearer {accessToken}
```

#### 4. Logout (POST)
```
POST http://localhost:3000/api/auth/logout
Authorization: Bearer {accessToken}
```

---

### Option 2: Using VS Code REST Client Extension

Create a file `api-test.rest`:

```rest
### Register
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "citizen"
}

### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Get Me (replace token)
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE

### Logout
POST http://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Option 3: Test in Browser

1. **Start your frontend:**
   ```bash
   npm run dev
   ```
   Opens at http://localhost:8080

2. **Go to Register Page** (or Login):
   - URL: http://localhost:8080/register

3. **Fill in the form:**
   - Name: Nguyễn Văn A
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
   - Role: Select one

4. **Click Register**
   - If backend is running: Success toast & redirect to dashboard
   - If backend is down: Error toast "Lỗi đăng ký. Vui lòng thử lại!"

5. **Check localStorage** (DevTools → Application → Local Storage):
   - `eco_token` - Contains JWT token
   - `eco_user` - Contains user object

6. **Test Login:**
   - Go to `/login`
   - Enter same credentials
   - Should login successfully

---

## Debug Tips

### Check Browser Console
- Network tab: See all API requests
- Console tab: Error messages from failed requests
- Application tab: View localStorage values

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Fill form and submit
4. Look for API requests:
   - `POST /api/auth/register` or `POST /api/auth/login`
   - Check Status (should be 200, 201)
   - Check Response (should contain `accessToken` and `user`)

### Common Errors

**Error: 422 Unprocessable Entity**
- Backend validation failed
- Check console for details
- Ensure email is not already registered
- Check password meets backend requirements

**Error: 401 Unauthorized**
- Invalid email or password
- Token expired (will auto redirect to login)

**Error: Network Error / Cannot reach server**
- Backend is not running
- Wrong API URL in `.env.local`
- CORS issue (backend needs to allow frontend origin)

**Error: Cannot find module 'axios'**
- Run: `npm install axios`

---

## What Happens Behind the Scenes

### On Register/Login Success:
1. ✅ API returns `{ accessToken, user }`
2. ✅ Token saved to localStorage (`eco_token`)
3. ✅ User info saved to localStorage (`eco_user`)
4. ✅ AuthContext state updated
5. ✅ User redirected to `/${role}` (e.g., `/citizen`, `/admin`)
6. ✅ Toast shows success message

### On Subsequent API Calls:
1. ✅ Token automatically added to headers: `Authorization: Bearer {token}`
2. ✅ If response is 401 → Token cleared → User redirected to login

### Page Refresh:
1. ✅ AuthContext reads localStorage on mount
2. ✅ If token exists, tries to fetch current user from `/api/auth/me`
3. ✅ If valid, user stays authenticated
4. ✅ If invalid, token cleared

---

## Success Indicators

✅ **Register page loads** without errors
✅ **Can submit form** without disabled state
✅ **Request appears** in Network tab
✅ **Response has** `accessToken` and `user`
✅ **localStorage** has `eco_token` and `eco_user`
✅ **Redirects** to correct dashboard (`/citizen`, `/enterprise`, etc.)
✅ **Can navigate** to protected routes
✅ **Logout works** and clears localStorage
✅ **Login with same credentials** works correctly

---

## If Something Goes Wrong

1. **Check backend is running:** `http://localhost:3000/api/auth/register` should respond (not error)
2. **Check `.env.local` file exists** with correct API URL
3. **Run `npm install axios`** if not installed
4. **Clear localhost storage** (DevTools → Application → Clear Site Data)
5. **Check browser console** for detailed error messages
6. **Check backend logs** for request errors
