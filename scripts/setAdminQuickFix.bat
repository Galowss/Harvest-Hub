@echo off
echo ========================================
echo Harvest Hub - Quick Admin Role Fixer
echo ========================================
echo.
echo This script will help you set admin role in Firestore.
echo.
echo Step 1: Make sure you're logged into your app
echo Step 2: Run this command in your browser console (F12):
echo.
echo ----------------------------------------
echo import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
echo import { getAuth } from 'firebase/auth';
echo.
echo const db = getFirestore();
echo const auth = getAuth();
echo.
echo // Check current user
echo console.log('Current user:', auth.currentUser.email, auth.currentUser.uid);
echo.
echo // Set admin role
echo await updateDoc(doc(db, 'users', auth.currentUser.uid), {
echo   role: 'admin'
echo });
echo.
echo console.log('✅ Admin role set! Refresh the page.');
echo ----------------------------------------
echo.
echo OR use the Firebase Console:
echo 1. Go to: https://console.firebase.google.com/
echo 2. Select your project
echo 3. Go to Firestore Database
echo 4. Open 'users' collection
echo 5. Find your user document
echo 6. Add/Edit field: role = "admin"
echo 7. Save
echo.
pause
