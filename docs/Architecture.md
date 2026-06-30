# 🏗️ PlacementPilot AI - Architecture Documentation

## System Overview

PlacementPilot AI is a modern web application built with React and powered by Google's Gemini AI. The architecture follows a layered approach with clear separation of concerns.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Presentation Layer (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Pages      │  │  Components  │  │   Routing    │             │
│  │  (Views)     │  │  (Reusable)  │  │  (RRDv7)     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    State Management Layer                            │
│  ┌──────────────────────┐   ┌──────────────────────┐               │
│  │   React Context      │   │   Custom Hooks       │               │
│  │  (Global State)      │   │  (Local State)       │               │
│  └──────────────────────┘   └──────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Services    │  │  AI Agents   │  │  Utilities   │             │
│  │  (Logic)     │  │  (Gemini)    │  │  (Helpers)   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Data Access Layer                              │
│  ┌──────────────────────┐   ┌──────────────────────┐               │
│  │   Repositories       │   │   Data Models        │               │
│  │  (Firestore/Local)   │   │   (TypeScript)       │               │
│  └──────────────────────┘   └──────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        External Services                             │
│  ┌──────────────────────┐   ┌──────────────────────┐               │
│  │  Google Gemini API   │   │  Firebase Services   │               │
│  │  (AI Intelligence)   │   │  (Auth, Firestore)   │               │
│  └──────────────────────┘   └──────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Presentation Layer

#### Pages
- **LandingPage**: Hero section with goal input
- **AnalysisPage**: Displays AI analysis results
- **RoadmapPage**: Week-by-week learning path visualization
- **DailyMissionPage**: Today's executable tasks
- **DashboardPage**: Progress overview with gamification

#### Components
- **GoalHealthCard**: Real-time health monitoring
- **XPRing**: Animated circular progress ring
- **StreakDisplay**: Fire emoji streak counter
- **AchievementBadge**: Badge unlock animations
- **MilestoneTimeline**: Visual milestone tracker

### 2. State Management

#### React Context
```typescript
AuthContext: User authentication state
StorageContext: Firestore/localStorage abstraction
GamificationContext: XP, levels, achievements
```

#### Custom Hooks
```typescript
useAuth(): Authentication operations
useFirestore(): Database operations
useProgress(): Task completion tracking
useGamification(): XP & achievement management
```

### 3. Business Logic Layer

#### AI Agents (Gemini-powered)
```typescript
goalAnalysis.ts: Evaluates goal difficulty & feasibility
roadmapGenerator.ts: Creates personalized learning paths
dailyMissionAgent.ts: Generates daily tasks
goalHealthAgent.ts: Monitors completion likelihood
executionIntelligence.ts: Behavioral pattern detection
```

#### Services
```typescript
progressService.ts: Task completion logic
xpService.ts: Experience point calculations
streakService.ts: Daily streak tracking
achievementService.ts: Badge unlock conditions
gamificationService.ts: Unified gamification engine
```

### 4. Data Access Layer

#### Repositories (Repository Pattern)
```typescript
userRepository.ts: User CRUD operations
goalRepository.ts: Goal persistence
roadmapRepository.ts: Roadmap versioning
progressRepository.ts: Progress tracking
```

#### Data Models
```typescript
User: userId, profile, preferences
Goal: goalId, title, deadline, status
Roadmap: weeks, milestones, version
Mission: tasks, xp, deadline
Progress: completedTasks, currentStreak, totalXP
```

## Data Flow Patterns

### User Journey Flow

```
1. User Input
   └─> LandingPage (goal text + deadline)
   
2. Goal Analysis
   └─> Gemini API analyzes input
   └─> Returns difficulty, feasibility, mode
   
3. Roadmap Generation
   └─> Gemini + Blueprints generate weeks
   └─> Save to Firestore
   
4. Daily Mission
   └─> Extract current week from roadmap
   └─> Gemini generates daily tasks
   └─> Display with XP values
   
5. Task Completion
   └─> User completes task
   └─> Update progress in Firestore
   └─> Calculate XP, check streak
   └─> Unlock achievements if conditions met
   
6. Behavioral Analysis
   └─> Execution Intelligence analyzes patterns
   └─> Provides personalized coaching
   
7. Goal Health Evaluation
   └─> Gemini evaluates progress vs roadmap
   └─> Predicts completion likelihood
   └─> Triggers replanning if needed
```

### Firebase Integration Pattern

```typescript
// Authentication Flow
Firebase Auth → AuthContext → useAuth() → UI Components

// Data Persistence Flow
UI Action → Repository → Firestore SDK → Cloud Firestore
Cloud Firestore → Real-time Listener → Repository → State Update → UI

// Migration Strategy
localStorage (Phase 1-4) → Migration Service → Firestore (Phase 5+)
```

## AI Integration Architecture

### Gemini API Integration

```typescript
// Primary Model: Gemini 2.5 Flash
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash-preview-exp',
  safetySettings: [...],
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 8192
  }
});

// Failover Model: Gemini 3.5 Flash
const fallbackModel = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash'
});
```

### Prompt Engineering

```typescript
// Structured Prompts with JSON Response
const prompt = `
Analyze this career goal: "${userGoal}"

Return JSON:
{
  "difficulty": "beginner|intermediate|advanced",
  "feasibility": "high|medium|low",
  "executionMode": "sprint|marathon",
  "estimatedWeeks": number,
  "requiredSkills": string[],
  "reasoning": string
}
`;
```

### AI Agent Responsibilities

| Agent | Input | Output | Model |
|-------|-------|--------|-------|
| Goal Analysis | User goal text | Difficulty, feasibility, mode | Gemini 2.5 Flash |
| Roadmap Generator | Analysis + blueprints | Week-by-week plan | Gemini 2.5 Flash |
| Daily Mission | Current week content | Daily tasks with XP | Gemini 2.5 Flash |
| Goal Health | Progress + roadmap | Health status + advice | Gemini 2.5 Flash |
| Execution Intelligence | Behavioral data | Patterns + coaching | Gemini 2.5 Flash |

## Security Architecture

### Firebase Security Rules

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    
    // Prevent unauthorized access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### API Key Security

- API keys stored in environment variables (`.env`)
- `.env` excluded from version control (`.gitignore`)
- No keys hardcoded in source code
- Vite's `VITE_` prefix for client-side exposure

### Authentication Security

- Firebase Authentication handles token management
- Automatic token refresh
- Session persistence with Firebase SDK
- Support for multiple auth providers

## Performance Optimizations

### Frontend Optimizations

1. **Code Splitting**: React.lazy() for route-based splitting
2. **Memoization**: React.memo() for expensive components
3. **Virtualization**: For large roadmap lists (if needed)
4. **Asset Optimization**: SVG icons, optimized images
5. **Tree Shaking**: Vite automatically removes unused code

### Caching Strategy

```typescript
// Firestore Cache
enableIndexedDbPersistence(db);

// Local Storage Fallback
localStorage.setItem('roadmap_cache', JSON.stringify(roadmap));

// In-Memory Cache
const roadmapCache = new Map<string, Roadmap>();
```

### Bundle Size Optimization

```typescript
// Lazy load heavy dependencies
const confetti = await import('canvas-confetti');

// Dynamic imports for AI agents
const { analyzeGoal } = await import('./ai/goalAnalysis');
```

## Deployment Architecture

### Hosting Options

1. **Firebase Hosting** (Recommended)
   ```bash
   npm run build
   firebase deploy
   ```

2. **Vercel/Netlify**
   - Connect GitHub repository
   - Auto-deploy on push to main

3. **Custom Server**
   - Build static files
   - Serve with Nginx/Apache

### CI/CD Pipeline (Future)

```yaml
# GitHub Actions Example
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
```

## Scalability Considerations

### Current Scale
- **Users**: 1-10,000 concurrent users
- **Database**: Firestore (1 GB free tier)
- **AI Calls**: ~100 requests per user per month

### Future Scaling

1. **Firestore Optimization**
   - Composite indexes for complex queries
   - Pagination for large datasets
   - Batch writes for performance

2. **Gemini API Optimization**
   - Response caching for similar queries
   - Rate limiting on client side
   - Batch processing where possible

3. **CDN Integration**
   - Cloudflare/Firebase CDN for static assets
   - Edge caching for improved latency

## Monitoring & Analytics

### Firebase Analytics Integration

```typescript
import { logEvent, analytics } from 'firebase/analytics';

// Track user actions
logEvent(analytics, 'task_completed', {
  taskType: 'daily_mission',
  xpEarned: 50
});

logEvent(analytics, 'achievement_unlocked', {
  badgeName: 'First Step'
});
```

### Error Monitoring

```typescript
// Firebase Crashlytics (Future)
import { crashlytics } from 'firebase/crashlytics';

try {
  await analyzeGoal(userInput);
} catch (error) {
  crashlytics().recordError(error);
  showErrorToUser();
}
```

## Testing Strategy

### Unit Tests
```typescript
// Services & utilities
describe('XP Service', () => {
  it('should calculate correct XP for task completion', () => {
    expect(calculateXP('daily_task', 'medium')).toBe(50);
  });
});
```

### Integration Tests
```typescript
// AI agents with mocked Gemini responses
describe('Goal Analysis Agent', () => {
  it('should parse Gemini response correctly', async () => {
    const result = await analyzeGoal(mockUserGoal);
    expect(result.difficulty).toBeDefined();
  });
});
```

### E2E Tests (Future)
- Playwright/Cypress for user journey testing
- Test complete flow from goal input to task completion

## Technology Decisions

### Why React 19?
- Latest features (Server Components ready)
- Best-in-class ecosystem
- Strong TypeScript support

### Why Vite 8?
- Lightning-fast HMR (Hot Module Replacement)
- Modern build tool with ESM support
- Superior developer experience vs Webpack

### Why Gemini 2.5 Flash?
- Cost-effective ($0.30 per 1M tokens)
- Fast response times (< 2 seconds)
- Strong reasoning capabilities
- JSON mode for structured output

### Why Firestore?
- Real-time synchronization
- Generous free tier
- Native Firebase integration
- Offline support built-in

### Why Tailwind CSS v4?
- Utility-first approach
- Zero runtime cost
- Excellent DX with IntelliSense
- Latest features (CSS variables, container queries)

## Conclusion

PlacementPilot AI's architecture prioritizes:

1. **Modularity**: Clear separation of concerns
2. **Scalability**: Ready for growth
3. **Maintainability**: Easy to extend and debug
4. **Performance**: Optimized for speed
5. **Security**: Production-ready security practices

The architecture leverages Google's ecosystem (Gemini, Firebase) for a cohesive, powerful solution.
