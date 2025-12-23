# 🔐 Enterprise Portal Login Guide

## Quick Start

**Portal URL**: https://dlt.aurigraph.io
**Username**: `admin`
**Password**: `admin`

## Login Steps

1. Open browser and go to: https://dlt.aurigraph.io
2. Enter Username: `admin`
3. Enter Password: `admin`
4. Click **Login** button
5. You will be redirected to the dashboard

## What to Expect

After successful login:
- ✅ Dashboard loads with navigation menu
- ✅ 6 API metric sections display data
- ✅ All Portal features available
- ✅ Session persists across page refreshes

## Common Issues & Solutions

### Issue: "Invalid credentials. Use admin/admin for demo."

**Cause**: Wrong username or password
**Solution**:
- Username must be exactly: `admin` (lowercase, no spaces)
- Password must be exactly: `admin` (lowercase, no spaces)
- Try again with correct credentials

### Issue: Login button doesn't work

**Solution**:
1. Open browser DevTools (F12)
2. Check Console tab for error messages
3. Take a screenshot of any errors
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try logging in again

### Issue: Stays on login page after clicking Login

**Solution**:
1. Clear browser cache: Ctrl+Shift+Delete
2. Open DevTools (F12) > Application tab > Local Storage
3. Clear all data for the site
4. Close browser and reopen
5. Try logging in again

### Issue: Session lost after page refresh

**Solution**:
1. Make sure you're not in private/incognito mode
2. Check that browser allows localStorage
3. Try a different browser (Chrome, Firefox, Safari)
4. Check browser console for errors (F12 > Console)

### Issue: Can't access portal (404 or blank page)

**Solution**:
1. Verify URL has HTTPS: https://dlt.aurigraph.io (not http://)
2. Check for padlock icon in address bar
3. Check browser console for JavaScript errors (F12)
4. Try: `curl https://dlt.aurigraph.io -k` to test server

## Authentication Details

### How It Works

- **Type**: Frontend demo authentication (no backend validation)
- **Storage**: Browser localStorage (`auth_token`, `auth_user`)
- **Session**: Persists across browser refreshes until logout
- **Token**: Demo token format: `demo-token-{timestamp}`

### File Locations

- **Login Page**: `src/pages/Login.tsx`
- **Auth Store**: `src/store/authSlice.ts`
- **Credentials Check**: Line 18 of Login.tsx

### Login Credentials Code

```typescript
// Username and password validation
if (username === 'admin' && password === 'admin') {
  // Create demo token with current timestamp
  const token = 'demo-token-' + Date.now()

  // Store in Redux and localStorage
  dispatch(loginSuccess({
    user: { id: '1', username: 'admin', role: 'admin' },
    token: token
  }))

  // Redirect to dashboard
  navigate('/')
}
```

### Session Storage

After login, localStorage contains:
- `auth_token`: Demo token for session
- `auth_user`: User information (JSON)

On logout, both are cleared.

## Browser DevTools Debugging

### Check Console for Errors

1. Press F12 to open DevTools
2. Click "Console" tab
3. Look for red error messages
4. Common errors:
   - "Uncaught SyntaxError" → Build issue
   - "Network error" → Backend not responding
   - "401 Unauthorized" → API key issue

### Check Network Requests

1. Press F12 and go to "Network" tab
2. Reload page (Ctrl+R)
3. Look for these requests:
   - `index.html` → should be 200 OK
   - `assets/*.js` → should be 200 OK
   - API calls → should be 200 OK
4. Red items indicate failed requests

### Check Local Storage

1. Press F12 and go to "Application" tab
2. Expand "Local Storage" on left
3. Click "https://dlt.aurigraph.io"
4. After login, you should see:
   - `auth_token` key with demo token
   - `auth_user` key with user data
5. If missing, authentication didn't save

## Portal Features After Login

✅ **Dashboard** - Main overview with metrics
✅ **Transactions** - View blockchain transactions
✅ **Performance** - Monitor system performance
✅ **Nodes** - Manage network nodes
✅ **RWA** - Real-world asset tokenization
✅ **Settings** - Configuration options

## Security Notes

### Current (Demo Mode)
- ✅ Credentials hardcoded for testing
- ✅ Token stored in localStorage
- ✅ No backend validation
- ⚠️ Not suitable for production

### Production Upgrades Needed
- Replace with real OAuth2/Keycloak
- Use httpOnly cookies for token storage
- Add password hashing (bcrypt)
- Implement JWT with expiration
- Add refresh token mechanism
- Enable CSRF protection
- Implement rate limiting
- Add two-factor authentication

## Tips

1. **Clear Cache**: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
2. **Check HTTPS**: Portal requires HTTPS, not HTTP
3. **Check Credentials**: Use exactly `admin` / `admin` (lowercase, no spaces)
4. **Try Incognito**: Bypass cache with private/incognito mode
5. **Verify URL**: https://dlt.aurigraph.io (with HTTPS)

## Support

If login fails:
1. Check browser console (F12 > Console)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try different browser
4. Verify HTTPS is working (padlock icon)
5. Check that portal loads (not 404 error)

---

**Portal Status**: ✅ LIVE at https://dlt.aurigraph.io
**Last Updated**: October 31, 2025
**Version**: 4.8.0
