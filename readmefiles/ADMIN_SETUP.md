# Admin Account Setup Guide

## Overview
This guide explains how to create and manage admin accounts in HarvestHub. Admins have special privileges to manage users, farmers, and product listings through the admin dashboard.

## Creating Your First Admin Account

### Method 1: Using Firebase Console (Recommended)

1. **Create a Regular User Account**
   - Go to your HarvestHub application
   - Navigate to the signup page
   - Create a new account with your admin email and password
   - Verify the email address

2. **Access Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your HarvestHub project
   - Click on "Firestore Database" in the left sidebar

3. **Update User Role**
   - Find the `users` collection
   - Locate the document with your user ID (the UID from authentication)
   - Click on the document to edit it
   - Find the `role` field (it should currently say "user" or "farmer")
   - Change the value from `"user"` to `"admin"`
   - Click "Update" to save changes

4. **Verify Admin Access**
   - Log out from your HarvestHub application
   - Log back in with the admin account credentials
   - You should automatically be redirected to `/dashboard/admin`
   - You will see the admin dashboard with user, farmer, and product management tabs

### Method 2: Using Firebase Admin SDK Script

If you have Node.js and Firebase Admin SDK set up, you can use this script:

```javascript
// scripts/createAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function makeUserAdmin(userId) {
  try {
    await db.collection('users').doc(userId).update({
      role: 'admin'
    });
    console.log(`Successfully updated user ${userId} to admin role`);
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

// Replace with the actual user ID
const userIdToMakeAdmin = 'USER_UID_HERE';
makeUserAdmin(userIdToMakeAdmin);
```

To run:
```bash
node scripts/createAdmin.js
```

## Admin Dashboard Features

Once logged in as admin, you can:

### User Management
- View all registered users
- Search users by name or email
- Delete user accounts (removes associated cart items and orders)
- See user statistics

### Farmer Management
- View all registered farmers
- Search farmers by name or email
- Delete farmer accounts (cascade deletes their products, orders, and ratings)
- Monitor farmer activity

### Product Management
- View all product listings
- Search products by name
- Remove inappropriate or outdated product listings
- Track total products in marketplace

## Security Considerations

### Important Notes:
1. **Protect Admin Credentials**: Admin accounts have elevated privileges. Use strong passwords and enable 2FA if available.

2. **Firestore Security Rules**: Update your `firestore.rules` to include admin permissions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection - admins can delete
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
      allow delete: if isAdmin();
    }
    
    // Products collection - admins can delete
    match /products/{productId} {
      allow read: if true;
      allow create, update: if request.auth != null;
      allow delete: if isAdmin() || 
                       get(/databases/$(database)/documents/products/$(productId)).data.farmerId == request.auth.uid;
    }
    
    // Orders collection - admins can delete
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
      allow delete: if isAdmin();
    }
    
    // Cart collection - admins can delete
    match /cart/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow delete: if isAdmin() || request.auth.uid == userId;
      
      match /items/{itemId} {
        allow read, write: if request.auth.uid == userId;
        allow delete: if isAdmin() || request.auth.uid == userId;
      }
    }
    
    // Ratings collection - admins can delete
    match /ratings/{ratingId} {
      allow read: if true;
      allow create, update: if request.auth != null;
      allow delete: if isAdmin();
    }
  }
}
```

3. **Deploy Updated Rules**:
```bash
firebase deploy --only firestore:rules
```

## Creating Additional Admin Accounts

To create more admin accounts:
1. Have the new admin create a regular account through signup
2. Use Method 1 (Firebase Console) to change their role to "admin"
3. Or have an existing admin create a script to programmatically update roles

## Removing Admin Access

To revoke admin privileges:
1. Access Firebase Console
2. Navigate to the user's document in Firestore
3. Change the `role` field from `"admin"` to `"user"` or `"farmer"`
4. The user will lose admin access on their next login

## Troubleshooting

### Admin Can't Access Dashboard
- Verify the `role` field in Firestore is exactly `"admin"` (case-sensitive)
- Clear browser cache and cookies
- Log out and log back in
- Check browser console for errors

### Deletion Not Working
- Ensure Firestore rules are deployed with admin permissions
- Check that cascade deletion logic is functioning
- Verify admin role in database

### Can't Find User ID
- Go to Firebase Authentication section
- Find the user by email
- Copy the UID (User ID) from the list

## Admin Dashboard URL

Direct link: `http://localhost:3000/dashboard/admin` (or your production URL)

The dashboard automatically redirects non-admin users to prevent unauthorized access.

## Best Practices

1. **Limit Admin Accounts**: Only create admin accounts for trusted personnel
2. **Regular Audits**: Periodically review admin actions and user management
3. **Backup Data**: Before bulk deletions, ensure you have database backups
4. **Test in Development**: Test admin features in a development environment first
5. **Monitor Activity**: Keep logs of admin actions for accountability

## Support

If you encounter issues with admin setup:
1. Check Firebase Console for error messages
2. Review browser console logs
3. Verify Firestore rules are properly deployed
4. Ensure the admin account exists in both Authentication and Firestore

---

**Last Updated**: January 2025  
**Version**: 1.0
