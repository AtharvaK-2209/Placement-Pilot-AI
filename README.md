# 🎯 PlacementPilot AI

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.15-orange)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF)](https://vitejs.dev/)

> **AI-powered placement preparation platform that converts career goals into adaptive execution roadmaps using Google Gemini.**


---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution) 
- [Key Features](#-key-features)
- [Google Technologies Used](#-google-technologies-used)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Folder Structure](#-folder-structure)
- [How It Works](#-how-it-works)
- [Future Scope](#-future-scope)

---

## 🎯 Problem Statement

Students preparing for placements face a common challenge:

- **Know WHAT to study** (DSA, System Design, SQL, Java, etc.)
- **Struggle with HOW to execute** consistently
- **Lack adaptive planning** when life interrupts preparation
- **Miss deadlines** due to poor time management
- **Lose motivation** without personalized feedback

Traditional static roadmaps don't adapt to individual progress, behavioral patterns, or real-world disruptions.

---

## 💡 Solution

**PlacementPilot AI** solves execution problems using **AI-powered behavioral intelligence**:

1. **Goal Analysis**: Gemini AI evaluates your goal, difficulty, and feasibility
2. **Personalized Roadmaps**: Generates deterministic week-by-week learning paths
3. **Daily Missions**: Breaks roadmap weeks into executable daily tasks
4. **Adaptive Replanning**: Dynamically adjusts roadmap when you fall behind
5. **Execution Intelligence**: Detects behavioral patterns and provides coaching
6. **Gamification**: XP system, streaks, achievements, and milestones keep you motivated
7. **Goal Health Monitoring**: Predicts completion likelihood and provides early warnings
8. **Future You Prediction**: Shows your projected skills and career readiness

**Result**: Students get a personal AI coach that adapts to their execution style, not just a static to-do list.

---

## ✨ Key Features

### 🤖 AI-Powered Intelligence

| Feature | Description | Technology |
|---------|-------------|------------|
| **Goal Analysis Agent** | Evaluates difficulty, feasibility, and execution mode | Google Gemini 2.5 Flash |
| **Roadmap Agent** | Blueprint-based deterministic week allocation | Gemini + Deterministic Logic |
| **Daily Mission Agent** | Converts roadmap weeks into daily execution plans | Gemini AI |
| **Goal Health Agent** | Evaluates likelihood of roadmap completion | Gemini AI + Behavioral Analysis |
| **Execution Intelligence** | Behavioral pattern detection & personalized coaching | Gemini AI + Firebase Analytics |
| **Adaptive Replanning** | Dynamic roadmap adjustment with versioning | Gemini AI + Firestore |

### 🎮 Gamification System

- **XP & Levels**: Earn experience points for task completion
- **Streaks**: Daily consistency tracking with fire emoji streaks 🔥
- **Achievements**: Unlock badges for milestones (First Step, Quick Learner, Consistent Coder)
- **Weekly Goals**: Track weekly progress with animated rings
- **Milestones**: Celebrate major roadmap completion points
- **Animated UI**: Premium animated XP rings, confetti effects, badge gallery

### 📊 Progress Tracking

- **Task Completion**: Track daily mission progress with XP rewards
- **Streak Tracking**: Never break your learning streak
- **Goal Health Metrics**: Visual health indicators (Healthy, At Risk, Critical)
- **Future You Prediction**: AI-powered career readiness forecast
- **Deadline Rescue**: Get warned before missing critical deadlines
- **Version History**: Track roadmap changes over time

### 🔐 Authentication & Persistence

- **Firebase Authentication**: Google SSO, email/password, anonymous auth
- **Cloud Firestore**: Real-time data synchronization across devices
- **Migration System**: Seamless migration from localStorage to Firestore
- **Secure Rules**: Production-ready Firestore security rules

---

## 🌐 Google Technologies Used

This project is built entirely on **Google Cloud & AI ecosystem**:

| Technology | Purpose | Impact |
|------------|---------|--------|
| **Google Gemini API** | Core AI engine for goal analysis, roadmap generation, daily missions, coaching | Powers all intelligent features |
| **Gemini 2.5 Flash** | Primary model for fast, cost-effective inference | Optimized response time |
| **Firebase Authentication** | User authentication (Google SSO, email/password) | Secure user management |
| **Cloud Firestore** | NoSQL database for real-time data persistence | Cross-device synchronization |
| **Firebase Hosting** | Static site deployment (optional) | Production deployment |


---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User Interface (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Landing     │  │  Dashboard   │  │  Roadmap     │             │
│  │  Page        │  │  (Progress)  │  │  Viewer      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      React Context & Hooks                           │
│  ┌──────────────────────┐   ┌──────────────────────┐               │
│  │   AuthContext        │   │   StorageContext     │               │
│  └──────────────────────┘   └──────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Business Logic Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  AI Agents   │  │  Services    │  │  Repositories│             │
│  │  (Gemini)    │  │  (XP, Health)│  │  (Firestore) │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        External Services                             │
│  ┌──────────────────────┐   ┌──────────────────────┐               │
│  │  Google Gemini API   │   │  Firebase / Firestore│               │
│  │  (AI Intelligence)   │   │  (Data Persistence)  │               │
│  └──────────────────────┘   └──────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Goal Input
    ↓
Goal Analysis Agent (Gemini)
    ↓
Roadmap Generator (Gemini + Blueprints)
    ↓
Daily Mission Generator (Gemini)
    ↓
Execution Engine (Task Completion)
    ↓
Behavioral Analysis (Execution Intelligence)
    ↓
Goal Health Evaluation (Gemini)
    ↓
Adaptive Replanning (if needed)
    ↓
Dashboard & Progress Visualization
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - Latest React with Server Components support
- **TypeScript 6.0** - Type-safe development
- **Vite 8.1** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first CSS framework
- **Framer Motion** - Advanced animations
- **React Router v7** - Client-side routing
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Firebase Authentication** - User authentication
- **Cloud Firestore** - NoSQL database with real-time sync
- **Firebase Security Rules** - Production-ready access control

### AI & Intelligence
- **Google Gemini 2.5 Flash** - Primary AI model
- **Google AI Studio** - Prompt engineering & testing
- **@google/genai SDK** - Official Gemini SDK

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **Vite Plugin React** - Fast refresh support

---

## 📸 Screenshots

### 🏠 Landing Page
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Landing%20Page/1.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Landing%20Page/2.png?raw=true)

> Clean, modern landing page with clear value proposition

### 📊 Dashboard
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Dashboard/1.png?raw=true)

> Progress overview with XP rings, streaks, and goal health

### 🎯 Goal Analysis
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Goal%20Analysis/1.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Goal%20Analysis/2.png?raw=true)


### 🗺️ Roadmap View
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Roadmap%20View/1.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Roadmap%20View/2.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Roadmap%20View/3.png?raw=true)

> Week-by-week learning path with milestones

### ✅ Daily Missions
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Daily%20Missions/1.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Daily%20Missions/2.png?raw=true)

> Today's executable tasks with XP rewards

### 💚 Goal Health Monitor
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Goal%20Health%20Monitor/1.png?raw=true)

> Real-time health tracking with AI insights

### 🔮 Future You Prediction
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Future%20You%20Prediction/1.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Future%20You%20Prediction/2.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Future%20You%20Prediction/3.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Future%20You%20Prediction/4.png?raw=true)

> AI-powered career readiness forecast

### 🏆 Achievements
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Achievements/1.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Achievements/2.png?raw=true)
![image alt](https://github.com/AtharvaK-2209/Placement-Pilot-AI/blob/main/Screenshots/Achievements/3.png?raw=true)

> Badge gallery with animated unlock effects

---

## 📁 Folder Structure

```
placement-pilot-ai/
├── src/
│   ├── ai/                      # AI Agents (Gemini integration)
│   │   ├── goalAnalysis.ts      # Goal Analysis Agent
│   │   ├── roadmapGenerator.ts  # Roadmap Agent
│   │   ├── dailyMissionAgent.ts # Daily Mission Agent
│   │   ├── goalHealthAgent.ts   # Goal Health Evaluator
│   │   └── executionIntelligence.ts # Behavioral Analysis
│   │
│   ├── data/blueprints/         # Learning Blueprints
│   │   ├── dsa.ts               # DSA learning path
│   │   ├── java.ts              # Java learning path
│   │   ├── sql.ts               # SQL learning path
│   │   └── springboot.ts        # Spring Boot learning path
│   │
│   ├── repositories/            # Data Access Layer
│   │   ├── userRepository.ts    # User data operations
│   │   ├── goalRepository.ts    # Goal CRUD
│   │   └── roadmapRepository.ts # Roadmap persistence
│   │
│   ├── services/                # Business Logic
│   │   ├── progressService.ts   # Task completion logic
│   │   ├── xpService.ts         # XP & leveling system
│   │   ├── streakService.ts     # Streak tracking
│   │   ├── achievementService.ts # Achievement unlocks
│   │   └── gamificationService.ts # Gamification engine
│   │
│   ├── hooks/                   # React Hooks
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useFirestore.ts      # Firestore operations
│   │   ├── useProgress.ts       # Progress tracking
│   │   └── useGamification.ts   # Gamification state
│   │
│   ├── pages/                   # Page Components
│   │   ├── LandingPage.tsx      # Home page
│   │   ├── GoalPage.tsx         # Goal input
│   │   ├── AnalysisPage.tsx     # Analysis results
│   │   ├── RoadmapPage.tsx      # Roadmap viewer
│   │   ├── DailyMissionPage.tsx # Today's tasks
│   │   └── DashboardPage.tsx    # Progress dashboard
│   │
│   ├── components/              # Reusable Components
│   │   ├── GoalHealthCard.tsx   # Health display
│   │   ├── XPRing.tsx           # Animated XP ring
│   │   ├── StreakDisplay.tsx    # Streak counter
│   │   ├── AchievementBadge.tsx # Badge component
│   │   └── MilestoneTimeline.tsx # Milestone tracker
│   │
│   ├── types/                   # TypeScript Types
│   │   ├── goal.ts              # Goal interfaces
│   │   ├── roadmap.ts           # Roadmap types
│   │   ├── mission.ts           # Mission types
│   │   └── gamification.ts      # Gamification types
│   │
│   ├── prompts/                 # AI Prompt Templates
│   │   └── promptTemplates.ts   # Gemini prompts
│   │
│   ├── config/                  # Configuration
│   │   └── firebase.ts          # Firebase initialization
│   │
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
│
├── public/                      # Static Assets
│   ├── favicon.svg              # Favicon
│   └── icons.svg                # Icon sprites
│
├── docs/                        # Documentation
│   ├── architecture/            # Architecture docs
│   ├── screenshots/             # App screenshots
│   └── archive/                 # Development history
│
├── firestore.rules              # Firestore security rules
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite configuration
├── .gitignore                   # Git ignore rules
├── LICENSE                      # MIT License
└── README.md                    # This file
```

---

## 🔄 How It Works

### 1. Goal Analysis Phase
```typescript
User enters goal: "Get placed in FAANG in 6 months"
    ↓
Gemini AI analyzes:
  - Difficulty: Advanced
  - Feasibility: Possible (if consistent)
  - Required skills: DSA, System Design, Behavioral
  - Estimated weeks: 24 weeks
```

### 2. Roadmap Generation
```typescript
Gemini + Blueprints generate week-by-week plan:
  Week 1-4:   Arrays & Strings (Easy problems)
  Week 5-8:   Two Pointers & Sliding Window
  Week 9-12:  Trees & Graphs
  Week 13-16: Dynamic Programming
  Week 17-20: System Design Basics
  Week 21-24: Mock Interviews & Company Prep
```

### 3. Daily Mission Execution
```typescript
Daily tasks for Week 1, Day 1:
  ✅ Solve 2 array problems (50 XP)
  ✅ Watch YouTube video on arrays (25 XP)
  ✅ Review solutions (25 XP)
  Total: 100 XP → Level up!
```

### 4. Behavioral Intelligence
```typescript
Execution patterns detected:
  - Completes tasks in evening (7-10 PM)
  - Struggles with medium problems
  - Consistent on weekdays, drops on weekends

AI Coaching:
  "You perform best in evenings. Consider scheduling harder
   topics during your peak hours (7-9 PM)."
```

### 5. Adaptive Replanning
```typescript
If user falls behind:
  Original: 24 weeks
  Current: Week 8, only 40% complete
  
  AI Replans:
  - Extend deadline by 4 weeks
  - Compress less critical weeks
  - Maintain core topics
  - Update milestones
```

---

## 🔮 Future Scope

### Planned Features

- [ ] **Multi-Goal Support**: Track multiple placement goals simultaneously
- [ ] **Peer Comparison**: Anonymous benchmarking with similar learners
- [ ] **Interview Prep Mode**: Mock interview scheduling with AI feedback
- [ ] **Resource Recommendations**: Curated resources based on progress
- [ ] **Notification System**: Smart reminders and deadline alerts

### Technical Improvements

- [ ] Advanced caching strategies
- [ ] Performance monitoring with Firebase Analytics
- [ ] A/B testing for feature optimization
- [ ] Internationalization (i18n) support
- [ ] Dark mode with system preference detection
- [ ] Progressive Web App (PWA) support
- [ ] Real-time collaboration features

---

## 👥 Contributors

This project was built for the **Google Developer Groups (GDG) x Coding Ninjas Hackathon - Vibe2Ship**.

---

## Acknowledgments

- **Google Gemini Team** - For the amazing AI capabilities
- **Firebase Team** - For robust backend infrastructure
- **Coding Ninjas** - For organizing the hackathon
- **GDG Community** - For support and guidance

---

## 📞 Contact & Links

- **Email**: atharvakalam2209@gmail.com
- **GitHub Repository**: [Github Repo](https://github.com/yourusername/placement-pilot-ai)
- **Documentation**: [docs](https://docs.google.com/document/d/1kuGK1GSW0syCpu_wWyJ_VjEInNXxtdQzRGILvFDKRWA/edit?tab=t.0)
- **Report Issues**: [GitHub Issues](https://github.com/yourusername/placement-pilot-ai/issues)
- **Website Link**: [PlacementPilot AI](https://placement-pilot-ai.web.app/)
---

<div align="center">

### Built with ❤️ using Google Technologies

**Made for GDG x Coding Ninjas Hackathon 2026**

[⭐ Star this repo](https://github.com/yourusername/placement-pilot-ai) • [🐛 Report Bug](https://github.com/yourusername/placement-pilot-ai/issues) • [✨ Request Feature](https://github.com/yourusername/placement-pilot-ai/issues)

</div>
