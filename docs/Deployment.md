# 🚀 Deployment Guide - PlacementPilot AI

This guide covers deployment options for PlacementPilot AI, from development to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Process](#build-process)
3. [Firebase Hosting Deployment](#firebase-hosting-deployment)
4. [Vercel Deployment](#vercel-deployment)
5. [Netlify Deployment](#netlify-deployment)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Firebase project created (for Firebase Hosting)
- ✅ Google Gemini API key
- ✅ Firebase configuration (Auth + Firestore enabled)
- ✅ Production environment variables ready

---

## Build Process

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create a `.env` file with production values:

```env
VITE_FIREBASE_API_KEY=your_production_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_production_gemini_api_key
```

### 3. Build Production Bundle

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 4. Preview Locally (Optional)

```bash
npm run preview
```

Access at `http://localhost:4173` to test the production build.

---

## Firebase Hosting Deployment

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase Hosting

```bash
firebase init hosting
```

**Configuration answers:**
- Use existing project: Select your Firebase project
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No` (or `Yes` for GitHub Actions)
- Overwrite index.html: `No`

This creates `firebase.json` and `.firebaserc`.

### Step 4: Deploy Firestore Rules

Ensure `firestore.rules` exists:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

### Step 5: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your app will be live at:
```
https://YOUR_PROJECT_ID.web.app
https://YOUR_PROJECT_ID.firebaseapp.com
```

### Optional: Custom Domain

1. Go to Firebase Console → Hosting → Custom Domains
2. Add your domain (e.g., `placementpilot.ai`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (24-48 hours)

---

## Vercel Deployment

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow prompts to deploy.

### Option 2: Vercel GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables in Vercel dashboard
7. Deploy

### Environment Variables in Vercel

Navigate to **Project Settings → Environment Variables** and add:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GEMINI_API_KEY
```

---

## Netlify Deployment

### Option 1: Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Option 2: Netlify UI

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Connect GitHub repository
5. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
6. Add environment variables
7. Deploy

### Netlify Configuration File

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures React Router works correctly.

---

## Environment Variables

### Development vs Production

**Development** (`.env.local`):
```env
VITE_GEMINI_API_KEY=dev_api_key
VITE_FIREBASE_API_KEY=dev_firebase_key
```

**Production** (`.env.production`):
```env
VITE_GEMINI_API_KEY=prod_api_key
VITE_FIREBASE_API_KEY=prod_firebase_key
```

### Security Best Practices

1. **Never commit `.env` files to Git**
   - Already in `.gitignore`
   
2. **Use different API keys for dev/prod**
   - Separate Firebase projects for dev/staging/prod
   
3. **Rotate keys periodically**
   - Update keys every 90 days
   
4. **Restrict API key usage**
   - Set HTTP referrer restrictions in Google Cloud Console
   - Limit Gemini API key to production domain

---

## Post-Deployment Checklist

### Functionality Tests

- [ ] **Authentication**
  - [ ] Google Sign-In works
  - [ ] Email/Password login works
  - [ ] Anonymous auth works (if enabled)
  - [ ] Logout works correctly

- [ ] **Core Features**
  - [ ] Goal analysis completes successfully
  - [ ] Roadmap generates correctly
  - [ ] Daily missions load
  - [ ] Task completion updates progress
  - [ ] XP system awards points
  - [ ] Achievements unlock

- [ ] **Persistence**
  - [ ] Data saves to Firestore
  - [ ] Data loads after refresh
  - [ ] Cross-device sync works

- [ ] **UI/UX**
  - [ ] All pages load without errors
  - [ ] Responsive design works on mobile
  - [ ] Animations play smoothly
  - [ ] No console errors

### Performance Tests

- [ ] **Lighthouse Score**
  - Performance: > 90
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90

- [ ] **Load Times**
  - Initial load: < 3 seconds
  - Route transitions: < 500ms
  - AI responses: < 3 seconds

### Security Checks

- [ ] **Firestore Rules**
  - Rules deployed correctly
  - Users can only access own data
  - Unauthorized access blocked

- [ ] **API Keys**
  - No keys exposed in client bundle
  - API key restrictions enabled
  - Rate limiting configured

### Monitoring

- [ ] **Firebase Analytics**
  - Events tracked correctly
  - User engagement visible

- [ ] **Error Tracking**
  - Set up Firebase Crashlytics (optional)
  - Monitor console for errors

---

## Troubleshooting

### Build Errors

**Error: TypeScript compilation failed**

```bash
# Fix TypeScript errors
npm run lint

# If errors persist, check tsconfig.json
```

**Error: Module not found**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Firebase Deployment Issues

**Error: Permission denied**

```bash
# Re-login to Firebase
firebase logout
firebase login
```

**Error: Deployment quota exceeded**

- Firebase free tier: 10 GB/month hosting
- Upgrade to Blaze plan if needed

### Environment Variable Issues

**Variables not loading**

1. Ensure variables start with `VITE_`
2. Restart dev server after changing `.env`
3. Check Vite documentation for environment variable rules

**Firebase initialization fails**

```typescript
// Check config in src/config/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ... other keys
};

// Debug: Log keys (remove in production!)
console.log('Firebase API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
```

### Firestore Rules Errors

**Error: Missing or insufficient permissions**

```bash
# Re-deploy rules
firebase deploy --only firestore:rules

# Test rules in Firebase Console
# Go to Firestore → Rules → Rules Playground
```

### Routing Issues (404 on Refresh)

**Vercel**: Should work automatically

**Netlify**: Add `netlify.toml` (see Netlify section)

**Firebase**: Already configured in `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## CI/CD Automation (Optional)

### GitHub Actions for Firebase

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

Add secrets in GitHub repository settings:
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_API_KEY`
- `GEMINI_API_KEY`
- etc.

---

## Domain Configuration

### Custom Domain Setup

1. **Purchase Domain** (Namecheap, Google Domains, etc.)

2. **Firebase Hosting Custom Domain**
   - Firebase Console → Hosting → Add Custom Domain
   - Add A records to DNS:
     ```
     A    @       151.101.1.195
     A    @       151.101.65.195
     ```

3. **SSL Certificate**
   - Automatically provisioned by Firebase
   - Takes 24-48 hours

4. **DNS Propagation**
   - Check status: `dig your-domain.com`
   - Allow 24-48 hours for global propagation

---

## Performance Optimization

### CDN Configuration

Firebase Hosting automatically uses Google's global CDN.

### Caching Strategy

Vite automatically adds cache headers:
```
/assets/*.js  →  Cache-Control: max-age=31536000 (1 year)
/index.html   →  Cache-Control: no-cache
```

### Bundle Size Analysis

```bash
npm run build -- --report
```

This generates a bundle size visualization.

---

## Monitoring & Analytics

### Firebase Analytics Setup

Already integrated in `src/config/firebase.ts`:

```typescript
import { getAnalytics } from 'firebase/analytics';
const analytics = getAnalytics(app);
```

### Performance Monitoring

Enable Firebase Performance Monitoring:

```bash
firebase init performance
```

### Real User Monitoring

Monitor real user metrics in Firebase Console:
- Page load times
- Network latency
- API response times

---

## Rollback Procedure

### Firebase Hosting Rollback

```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:channel:deploy CHANNEL_ID --only hosting
```

### Vercel Rollback

1. Go to Vercel Dashboard
2. Select project
3. Click "Deployments"
4. Find previous deployment
5. Click "..." → "Promote to Production"

---

## Support & Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Vite Documentation**: https://vitejs.dev
- **Gemini API Documentation**: https://ai.google.dev/docs

---

**Deployment Complete! 🎉**

Your PlacementPilot AI app is now live and ready to help students ace their placement preparation.
