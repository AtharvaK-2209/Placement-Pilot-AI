# Firestore Security Rules Deployment

## Critical: Deploy Security Rules to Fix Task Completion

The Daily Mission task completion persistence bug is caused by **missing Firestore security rules**. Without proper security rules, authenticated users cannot write to their own documents, causing the "Missing or insufficient permissions" error.

## Deployment Steps

### Option 1: Deploy via Firebase Console (Recommended for Quick Fix)

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore Rules**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Copy and Paste Rules**
   - Replace the existing rules with the content from `firestore.rules` file:
   ```
   rules_version = '2';

   service cloud.firestore {
     match /databases/{database}/documents {
       
       // User document and all subcollections
       match /users/{userId}/{document=**} {
         // Allow read and write if the user is authenticated and is accessing their own data
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Deny all other access
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

4. **Publish Rules**
   - Click the "Publish" button
   - Wait for confirmation (usually instant)

5. **Verify**
   - Refresh your application
   - Try completing a task
   - Check browser console - should see success messages instead of permission errors

---

### Option 2: Deploy via Firebase CLI

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done)
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Accept default file names (firestore.rules, firestore.indexes.json)

4. **Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Verify Deployment**
   ```bash
   firebase firestore:rules:get
   ```

---

## What These Rules Do

### Security Model
- **Authenticated users only**: Users must be logged in (request.auth != null)
- **User data isolation**: Users can only access their own data (request.auth.uid == userId)
- **Subcollection access**: The `{document=**}` pattern grants access to all subcollections

### Protected Paths
All user data is scoped under `/users/{userId}/`:
- `/users/{uid}/progress/current` - User progress aggregate
- `/users/{uid}/roadmapProgress/current` - Roadmap execution state
- `/users/{uid}/dailyMissions/*` - Generated daily missions
- `/users/{uid}/roadmaps/*` - Roadmap versions
- `/users/{uid}/goalHealth/*` - Goal health scores
- `/users/{uid}/executionIntelligence/*` - Execution intelligence analysis
- `/users/{uid}/futureSimulation/*` - Future You predictions
- `/users/{uid}/deadlineRescue/*` - Deadline rescue strategies

### Access Control
- ✅ User can read/write their own data (`/users/abc123/*` when uid=abc123)
- ❌ User cannot read/write other users' data (`/users/xyz789/*` when uid=abc123)
- ❌ Unauthenticated users cannot access any data

---

## Validation

After deploying the rules, verify that task completion works:

### 1. Check Firestore Rules in Console
- Go to Firebase Console → Firestore → Rules
- Verify the rules match the content above
- Check "Last deployed" timestamp

### 2. Test Task Completion
1. Login to the application
2. Navigate to a Daily Mission
3. Click a task checkbox
4. **Expected behavior**:
   - Checkbox remains checked after page refresh
   - XP increases
   - Console shows success messages:
     ```
     [FirestoreProgressRepository] ✓ Day progress saved successfully for w1-d1
     [FirestoreProgressRepository] ✓ Task update persisted successfully for w1-d1
     ```

### 3. Check Console Logs
- Open browser DevTools (F12)
- Click Console tab
- Complete a task
- **Should see**: Success messages (✓)
- **Should NOT see**: Permission errors, "day not found" errors

---

## Common Issues

### Issue: "Missing or insufficient permissions"
**Cause**: Rules not deployed or incorrect project selected  
**Fix**: 
1. Verify you're in the correct Firebase project
2. Redeploy rules via console or CLI
3. Hard refresh the app (Cmd+Shift+R / Ctrl+Shift+F5)

### Issue: "day not found" error persists
**Cause**: Old progress data without day entries  
**Fix**:
1. Delete the `/users/{uid}/progress/current` document in Firestore Console
2. Logout and login again
3. Generate a new mission
4. Try completing a task

### Issue: Rules deployed but still getting errors
**Cause**: Browser cache or pending writes  
**Fix**:
1. Clear browser cache
2. Logout and login again
3. Check Firebase Console → Firestore → Usage tab for error details

---

## Testing Rules in Firebase Console

You can test the rules before deploying using the Firebase Rules Simulator:

1. Go to Firestore → Rules tab
2. Click "Rules Playground" button
3. Test scenarios:

**Test 1: Authenticated user reading own data**
```
Location: /users/test-uid-123/progress/current
Auth: Authenticated (uid: test-uid-123)
Operation: get
Expected: ✅ Allowed
```

**Test 2: Authenticated user writing own data**
```
Location: /users/test-uid-123/progress/current
Auth: Authenticated (uid: test-uid-123)
Operation: set
Expected: ✅ Allowed
```

**Test 3: Authenticated user reading other user's data**
```
Location: /users/other-uid-456/progress/current
Auth: Authenticated (uid: test-uid-123)
Operation: get
Expected: ❌ Denied
```

**Test 4: Unauthenticated user reading data**
```
Location: /users/test-uid-123/progress/current
Auth: Unauthenticated
Operation: get
Expected: ❌ Denied
```

---

## Next Steps After Deployment

1. ✅ Deploy Firestore security rules
2. ✅ Test task completion flow end-to-end
3. ✅ Verify data persists after logout/login
4. ✅ Check all console logs are success messages
5. ✅ Monitor Firestore usage in Firebase Console

---

## Emergency Rollback

If the new rules cause issues:

### Via Console
1. Go to Firestore → Rules
2. Click on "Rollback" link above the editor
3. Select previous version
4. Click "Publish"

### Via CLI
```bash
# View rule versions
firebase firestore:rules:list

# Restore specific version
firebase firestore:rules:restore [VERSION_ID]
```

---

**Status**: ⚠️ **CRITICAL - MUST DEPLOY IMMEDIATELY**

Without these rules, task completion will fail with permission errors. Deploy the rules first, then test the application to verify the fix.
