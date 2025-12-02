# 🔧 Fix Admin Permissions Issue

## Problem
Admin users getting "permission-denied" error when trying to:
- Delete users
- Promote users to admin
- Delete farmers/products

## Root Cause
Your user document in Firestore may not have `role: "admin"` set properly.

---

## ✅ Solution (Choose One Method)

### Method 1: Manual Fix in Firebase Console (EASIEST)

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: Harvest-Hub
3. **Go to Firestore Database** (left sidebar)
4. **Navigate to `users` collection**
5. **Find YOUR user document** (search by your email)
6. **Click on the document to edit it**
7. **Add or update the `role` field**:
   - Field name: `role`
   - Type: `string`
   - Value: `admin`
8. **Click Save**
9. **Refresh your application** and try again

### Method 2: Deploy Updated Rules

The rules have been updated in `firestore.rules`. Deploy them:

```bash
firebase login
firebase deploy --only firestore:rules
```

### Method 3: Use Browser Console

1. **Open your admin dashboard** in Chrome/Edge
2. **Press F12** to open DevTools
3. **Go to Console tab**
4. **Paste this code**:

```javascript
// Import Firebase
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();
const currentUser = auth.currentUser;

if (currentUser) {
  updateDoc(doc(db, 'users', currentUser.uid), {
    role: 'admin'
  }).then(() => {
    console.log('✅ Successfully promoted to admin!');
    alert('You are now an admin! Refresh the page.');
  }).catch(error => {
    console.error('❌ Error:', error);
  });
} else {
  console.error('No user logged in');
}
```

4. **Press Enter**
5. **Refresh the page**

---

## 🔍 Verify Admin Status

After making the change, verify it worked:

### In Firebase Console:
1. Open your user document in Firestore
2. Check that `role` field = `"admin"`

### In Your App:
1. Go to Admin Dashboard
2. Open browser console (F12)
3. Run:
```javascript
console.log('Current user:', auth.currentUser.uid);
```
4. Find that document in Firestore and verify role is "admin"

---

## 📋 Updated Firestore Rules Summary

The rules now properly allow admins to:
- ✅ Read all users
- ✅ Update any user (including role changes)
- ✅ Delete any user (except themselves)
- ✅ Delete orders, products, cart items, ratings
- ✅ Update wallets and transactions

**Key rule change:**
```javascript
// Admins can update any user (including role changes)
allow update: if isAdmin();

// Admins can delete any user EXCEPT themselves
allow delete: if isAdmin() && request.auth.uid != userId;
```

---

## 🚨 If Still Not Working

### Check these things:

1. **User document exists?**
   - Go to Firestore Console
   - Users collection
   - Search for your email
   - If not found, create it manually with role: "admin"

2. **Correct spelling?**
   - Field must be exactly: `role` (lowercase)
   - Value must be exactly: `admin` (lowercase)
   - Type must be: `string`

3. **Logged in?**
   - Make sure you're logged into the app
   - Check browser console: `auth.currentUser`

4. **Cache issue?**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Try incognito mode

5. **Rules deployed?**
   - Run: `firebase deploy --only firestore:rules`
   - Check Firebase Console > Firestore > Rules tab
   - Verify publish date is recent

---

## 📞 Need More Help?

Run this in terminal to check your Firebase setup:
```bash
firebase projects:list
firebase use
```

Check the rules are valid:
```bash
firebase deploy --only firestore:rules --dry-run
```

---

## ✅ After Fix

Once admin role is set, you should be able to:
- ✅ Delete users
- ✅ Delete farmers
- ✅ Delete products
- ✅ Promote users to admin
- ✅ Cancel orders
- ✅ View all wallet transactions

The error "Missing or insufficient permissions" will be gone! 🎉
