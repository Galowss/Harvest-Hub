-- Run this SQL in Firebase Console to check admin status
-- Go to: Firebase Console > Firestore Database > Query

-- Check your user document
SELECT * FROM users WHERE role = 'admin'

-- Or use the Firestore console to:
-- 1. Go to Firestore Database
-- 2. Open the 'users' collection
-- 3. Find your user document (by email)
-- 4. Edit the document
-- 5. Set field: role = "admin" (as a string)
-- 6. Save

-- Your document should look like:
-- {
--   email: "your-email@example.com",
--   role: "admin",  ← Make sure this is set to "admin"
--   name: "Your Name",
--   createdAt: timestamp,
--   ...
-- }
