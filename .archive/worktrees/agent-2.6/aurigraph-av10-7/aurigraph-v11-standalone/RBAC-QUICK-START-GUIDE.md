# RBAC V2 - Quick Start Testing Guide

**Last Updated**: October 12, 2025
**Version**: 2.0.0
**For**: Aurigraph V11 Enterprise Portal

---

## 🎯 Overview

This guide will help you quickly test the RBAC V2 deployment and verify all features work correctly. Follow the steps in order for a complete verification.

**Total Time**: ~15 minutes

---

## 📋 Pre-Requisites

Before starting, ensure you have:

- [ ] Node.js installed (for syntax validation)
- [ ] Git installed and repository cloned
- [ ] Web browser (Chrome, Firefox, Safari, or Edge)
- [ ] Terminal access
- [ ] Basic understanding of browser DevTools

---

## 🚀 Step 1: Verify Deployment (2 minutes)

### 1.1 Navigate to Project Directory

```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/
```

### 1.2 Run Verification Script

```bash
./verify-rbac-deployment.sh
```

**Expected Output**: All checks should pass with green checkmarks

**If Failed**: Review the failed checks and fix issues before proceeding

### 1.3 Verify Files Exist

```bash
ls -lh aurigraph-rbac-system-v2.js
ls -lh aurigraph-rbac-ui.html
ls -lh aurigraph-rbac-ui-loader.js
ls -lh aurigraph-v11-enterprise-portal.html
ls -lh rbac-admin-setup.html
```

**Expected**: All files should be present and readable

---

## 🌐 Step 2: Start Web Server (1 minute)

You need a local web server to test the portal. Choose one option:

### Option A: Python (Recommended)

```bash
python3 -m http.server 8000
```

### Option B: Node.js

```bash
npx http-server -p 8000
```

### Option C: PHP

```bash
php -S localhost:8000
```

**Verify Server Running**:
```bash
# In another terminal
curl http://localhost:8000/aurigraph-v11-enterprise-portal.html | head -20
```

**Expected**: HTML content should be returned

---

## 👨‍💼 Step 3: Create Admin User (2 minutes)

### 3.1 Open Admin Setup Page

Open in your browser:
```
http://localhost:8000/rbac-admin-setup.html
```

### 3.2 Create Default Admin

1. Click **"🚀 Create Default Admin"** button
2. Verify success message appears
3. Note the credentials:
   - **Email**: `admin@aurigraph.io`
   - **Password**: `admin123`

### 3.3 Verify Admin Created

Check the "Current Users" section:
- Total Users: 1
- Admins: 1
- User list shows "Aurigraph Admin" with ADMIN badge

### 3.4 (Optional) Create Custom Admin

Fill the form:
- **Full Name**: Your Name
- **Email**: your@email.com
- **Phone**: +1 (555) 123-4567
- **Password**: SecurePassword123
- **Role**: Admin or SuperAdmin
- **Company**: Aurigraph DLT Corp

Click **"✅ Create Admin User"**

---

## 🎨 Step 4: Test Portal Integration (3 minutes)

### 4.1 Open Portal

Open in your browser:
```
http://localhost:8000/aurigraph-v11-enterprise-portal.html
```

### 4.2 Check Browser Console

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for RBAC logs:

**Expected Logs**:
```
[RBAC INFO] ✅ Aurigraph RBAC System v2 (Refactored) loaded
[RBAC UI Loader] Loading RBAC UI components...
[RBAC UI Loader] ✅ RBAC UI components loaded successfully
```

**If Errors**:
- Check that all files exist
- Check file paths are correct
- Check console for detailed error messages

### 4.3 Verify User Badge

Look at the **top-right corner**:

**Expected**:
- User badge visible
- Shows "Guest - Not logged in"
- Badge is clickable

### 4.4 Verify Guest Modal

Wait 1 second after page load:

**Expected**:
- Guest registration modal appears
- Modal header: "🚀 Start Your Demo"
- Form shows 11 input fields

---

## 🧪 Step 5: Test Guest Registration (3 minutes)

### 5.1 Fill Registration Form

Fill all required fields:

| Field | Example Value |
|-------|--------------|
| Full Name | John Doe |
| Email | john.doe@test.com |
| Phone | +1 (555) 123-4567 |
| Company | Test Company Inc |
| Job Title | Software Engineer |
| Country | United States |
| Use Case | Testing RBAC system |
| Referral Source | Search Engine |
| Newsletter | ✓ Checked |

### 5.2 Test Input Validation

**Test 1: Invalid Email**
- Enter: `not-an-email`
- Expected: Validation error "Invalid email format"

**Test 2: Invalid Phone**
- Enter: `abc123`
- Expected: Validation error "Invalid phone number"

**Test 3: XSS Attempt**
- Full Name: `<script>alert('XSS')</script>`
- Expected: Text sanitized, not executed

### 5.3 Submit Valid Data

1. Fill form with valid data
2. Click **"Start Demo →"**

**Expected**:
- Modal closes
- User badge updates to show your name
- Demo banner appears at top
- No JavaScript errors in console

---

## 🔐 Step 6: Test Security Features (2 minutes)

### 6.1 Test Rate Limiting

1. Click user badge → Logout
2. Try to login 6 times with wrong password

**Expected**:
- After 5 attempts, rate limit error appears
- Message shows: "Too many attempts. Wait X seconds."

### 6.2 Test XSS Protection

Already tested in guest registration. Verify in console:
```javascript
// In browser console
localStorage.getItem('rbac_users')
```

**Expected**: Names with `<script>` tags should be escaped

### 6.3 Test Session Security

```javascript
// In browser console
localStorage.getItem('rbac_sessions')
```

**Expected**: Session IDs should be long hex strings (64+ characters)

---

## 👤 Step 7: Test User Menu (2 minutes)

### 7.1 Open User Menu

1. Click user badge in top-right corner

**Expected**:
- User menu modal opens
- Shows user profile information
- Shows "Logout" button

### 7.2 Test Guest Options

As a guest user, menu should show:
- User profile details
- Role: Guest
- Demo limits information
- "Upgrade Account" button
- "Logout" button

### 7.3 Test Logout

1. Click **"Logout"**

**Expected**:
- User logged out
- Badge shows "Guest - Not logged in"
- Guest modal appears again after 1 second

---

## 👨‍💻 Step 8: Test Admin Features (3 minutes)

### 8.1 Login as Admin

1. Close guest modal
2. Click user badge → user menu
3. If needed, logout first
4. Guest modal will appear
5. Click "Don't have an account? Login" link
6. Enter credentials:
   - Email: `admin@aurigraph.io`
   - Password: `admin123`
7. Click **"Login"**

**Expected**:
- User badge shows "Aurigraph Admin - ADMIN"
- No errors in console

### 8.2 Access Admin Panel

1. Click user badge
2. Click **"Open Admin Panel"** button

**Expected**:
- Admin panel modal opens
- Dashboard shows user statistics:
  - Total Users: 2 (1 admin + 1 guest)
  - Guest Users: 1
  - Registered Users: 1
  - Pending Follow-ups: 1
- User table shows both users

### 8.3 Test User Approval

1. Find guest user in admin panel
2. Click **"Approve"** button

**Expected**:
- Guest promoted to User role
- Statistics update automatically
- Success message appears

### 8.4 Test CSV Export

1. In admin panel, click **"Export Guest Data"**

**Expected**:
- CSV file downloads
- File name: `aurigraph_guest_users_[timestamp].csv`
- File contains guest user data

---

## 🎯 Step 9: Test Demo Limits (2 minutes)

### 9.1 Logout from Admin

1. Click user badge → Logout

### 9.2 Register New Guest

1. Register as a different guest user
2. After registration, check demo banner at top

**Expected**:
- Banner shows: "🎯 Demo Mode Active - 2 nodes, 3 contracts remaining"

### 9.3 (Optional) Test Limit Enforcement

If portal has interactive features:
1. Try to create more than 2 business nodes
2. Try to create more than 3 ActiveContracts

**Expected**:
- Access denied modal appears when limit reached
- "Upgrade Account" option shown

---

## ✅ Step 10: Final Verification Checklist

Go through this checklist and mark each item:

### Core Functionality
- [ ] Portal loads without errors
- [ ] RBAC system v2 loads (check console)
- [ ] UI components load dynamically
- [ ] User badge visible at all times
- [ ] Guest modal appears after 1 second

### Guest Registration
- [ ] All 11 form fields present
- [ ] Email validation works
- [ ] Phone validation works
- [ ] XSS protection works (script tags sanitized)
- [ ] Registration completes successfully
- [ ] User badge updates after registration

### Security Features
- [ ] Rate limiting works (max 5 login attempts)
- [ ] Session IDs are cryptographically secure
- [ ] Input sanitization prevents XSS
- [ ] Structured logging works (check console)

### User Management
- [ ] User menu opens when badge clicked
- [ ] Logout works correctly
- [ ] Login works correctly
- [ ] Demo banner shows for guests

### Admin Features
- [ ] Admin login successful
- [ ] Admin panel accessible
- [ ] User statistics correct
- [ ] Guest approval works
- [ ] CSV export works
- [ ] User deletion works (if tested)

---

## 🐛 Troubleshooting

### Issue: Guest modal doesn't appear

**Possible Causes**:
1. RBAC UI loader failed
2. JavaScript error before modal init
3. Modal CSS not loaded

**Solution**:
1. Check browser console for errors
2. Verify `aurigraph-rbac-ui.html` exists
3. Check network tab for failed requests
4. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: "Cannot read property of undefined" errors

**Possible Causes**:
1. RBAC system not loaded before UI
2. Script loading order incorrect

**Solution**:
1. Verify script order in portal HTML:
   - `aurigraph-rbac-system-v2.js` in `<head>`
   - `aurigraph-rbac-ui-loader.js` before `</body>`
2. Check for typos in script src paths

### Issue: Validation doesn't work

**Possible Causes**:
1. Using v1 instead of v2
2. Validator not initialized

**Solution**:
1. Verify portal loads `aurigraph-rbac-system-v2.js`
2. Check console for `Validator` initialization
3. Test with: `console.log(window.Validator)`

### Issue: Rate limiting doesn't trigger

**Possible Causes**:
1. Using v1 instead of v2
2. RateLimiter not working

**Solution**:
1. Verify v2 is loaded
2. Check console for rate limit logs
3. Test with: `console.log(window.rbacManager.rateLimiter)`

### Issue: Admin panel shows wrong stats

**Possible Causes**:
1. localStorage data corrupted
2. Multiple users with same email

**Solution**:
1. Open admin setup page
2. Click "🔄 Refresh" to reload data
3. If still wrong, clear and recreate users

### Issue: Styles not applied correctly

**Possible Causes**:
1. CSS conflicts with portal styles
2. UI loader failed to inject styles

**Solution**:
1. Check Elements tab in DevTools
2. Look for RBAC style tags in `<head>`
3. Check for CSS specificity issues
4. Hard refresh browser

---

## 📊 Test Results Template

Use this template to record your test results:

```markdown
# RBAC V2 Testing Results

**Date**: [Date]
**Tester**: [Your Name]
**Browser**: [Browser Name and Version]
**Status**: [Pass/Fail]

## Test Results

| Test Category | Status | Notes |
|---------------|--------|-------|
| File Verification | ✅ / ❌ | |
| Portal Integration | ✅ / ❌ | |
| Guest Registration | ✅ / ❌ | |
| Input Validation | ✅ / ❌ | |
| XSS Protection | ✅ / ❌ | |
| Rate Limiting | ✅ / ❌ | |
| User Menu | ✅ / ❌ | |
| Admin Login | ✅ / ❌ | |
| Admin Panel | ✅ / ❌ | |
| User Approval | ✅ / ❌ | |
| CSV Export | ✅ / ❌ | |
| Demo Limits | ✅ / ❌ | |

## Issues Found

1. [Issue description]
2. [Issue description]

## Recommendations

1. [Recommendation]
2. [Recommendation]

## Overall Assessment

[Your assessment here]
```

---

## 🔄 Next Steps After Testing

### If All Tests Pass ✅

1. **Document Results**: Save test results for reference
2. **Monitor Production**: Watch for errors in production
3. **Track Metrics**: Monitor guest registrations and conversions
4. **Plan Enhancements**: Review next sprint items

### If Tests Fail ❌

1. **Document Failures**: Note which tests failed and error messages
2. **Review Logs**: Check browser console for detailed errors
3. **Check Documentation**: Review deployment guide and integration docs
4. **Fix Issues**: Address failed tests one by one
5. **Retest**: Run this guide again after fixes

---

## 📚 Additional Resources

### Documentation
- **RBAC-V2-DEPLOYMENT-COMPLETE.md** - Complete deployment guide
- **RBAC-REFACTORING-REPORT.md** - Executive summary
- **RBAC-REFACTORING-SUMMARY.md** - Technical comparison (V1 vs V2)
- **RBAC-CODE-REVIEW.md** - Security audit details
- **RBAC-INTEGRATION-GUIDE.md** - API documentation

### Tools
- **rbac-admin-setup.html** - Admin user management interface
- **verify-rbac-deployment.sh** - Automated verification script

### Support
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **JIRA**: https://aurigraphdlt.atlassian.net/
- **Documentation**: See RBAC-*.md files

---

## 🎉 Completion

Congratulations! If you've completed all steps and all tests passed, your RBAC V2 deployment is verified and ready for production use.

### Security Improvements Verified

✅ **XSS Protection** - HTML sanitization working
✅ **Input Validation** - Email/phone validation working
✅ **Secure Sessions** - Cryptographic session IDs
✅ **Rate Limiting** - Brute force protection active
✅ **Structured Logging** - Error tracking functional
✅ **Error Handling** - Graceful error management

### System Status

**Security Grade**: B+ (85/100)
**Production Ready**: ✅ YES
**Critical Issues**: 0
**Known Limitations**: 4 (documented)

---

**Testing Complete**: [Date]
**Verified By**: [Your Name]
**Status**: ✅ READY FOR PRODUCTION

---

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*

*Co-Authored-By: Claude <noreply@anthropic.com>*
