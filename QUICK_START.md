# 🚀 PlacementPilot AI - Quick Start Guide

Get up and running with PlacementPilot AI in 5 minutes!

---

## ⚡ Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/placement-pilot-ai.git
cd placement-pilot-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 🎉

---

## 🔑 Getting API Keys

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or select existing)
3. Enable **Authentication** → Google Sign-In
4. Enable **Firestore Database**
5. Go to **Project Settings** → **General** → **Your apps**
6. Copy the Firebase config values

### Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Create a new API key (or use existing)
5. Copy the API key

---

## 📝 Essential Commands

```bash
# Development
npm run dev          # Start dev server (localhost:5173)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

---

## 🎯 First Steps After Setup

1. **Create an account** using Google Sign-In or Email/Password
2. **Enter your goal**: "Get placed in Google in 6 months"
3. **View AI analysis**: See difficulty, feasibility, execution mode
4. **Explore roadmap**: Check your personalized week-by-week plan
5. **Complete daily missions**: Start with today's tasks
6. **Track progress**: Monitor XP, streaks, and goal health

---

## 📚 Documentation

- **[README.md](README.md)** - Complete project overview
- **[Architecture.md](docs/Architecture.md)** - System architecture
- **[Deployment.md](docs/Deployment.md)** - Deployment guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Firebase Errors

```bash
# Verify environment variables
echo $VITE_FIREBASE_API_KEY

# Check .env file exists
cat .env
```

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

---

## 💡 Tips

- **Use Chrome DevTools** for debugging React components
- **Check Firebase Console** for Auth and Firestore data
- **Enable Firebase Emulators** for offline development (optional)
- **Use TypeScript** types for better IDE support

---

## 🆘 Need Help?

- **Documentation**: [docs/README.md](docs/README.md)
- **GitHub Issues**: Report bugs or ask questions
- **GitHub Discussions**: General questions and ideas

---

## ✅ System Requirements

- **Node.js**: 18 or higher
- **npm**: 9 or higher
- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Operating System**: Windows, macOS, or Linux

---

## 🎉 You're All Set!

Your PlacementPilot AI instance is running. Start preparing for placements with AI-powered execution intelligence!

**Next Steps**:
- Explore all features
- Complete your first daily mission
- Unlock achievements
- Track your progress

**Happy Learning! 🚀**
