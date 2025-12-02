@echo off
echo Deploying Firestore Rules...
echo.
firebase deploy --only firestore:rules
echo.
echo Deployment complete!
pause
