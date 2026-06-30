# Contributing to PlacementPilot AI

Thank you for your interest in contributing to PlacementPilot AI! 🎉

This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or personal attacks
- Publishing others' private information
- Any conduct that creates an unsafe environment

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Firebase account (for backend features)
- Google Gemini API key

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/placement-pilot-ai.git
   cd placement-pilot-ai
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/placement-pilot-ai.git
   ```

### Install Dependencies

```bash
npm install
```

### Set Up Environment

Create `.env` file:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

---

## Development Workflow

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/multi-goal-support`)
- `bugfix/` - Bug fixes (e.g., `bugfix/streak-calculation`)
- `docs/` - Documentation updates (e.g., `docs/api-documentation`)
- `refactor/` - Code refactoring (e.g., `refactor/repository-pattern`)
- `test/` - Test additions (e.g., `test/xp-service`)

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Build to check for errors
npm run build

# Manual testing
npm run dev
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add multi-goal support"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define interfaces** for all data structures
- **Avoid `any` type** - use proper types or `unknown`

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

### React Components

- **Functional components** with hooks
- **Named exports** for components
- **Props interface** for all components

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### File Organization

```
src/
├── components/       # Reusable UI components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── services/         # Business logic
├── repositories/     # Data access
├── types/            # TypeScript types
├── utils/            # Utility functions
└── config/           # Configuration files
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
  - `GoalHealthCard.tsx`
  - `xpService.ts`
- **Components**: PascalCase
  - `function DashboardPage() { ... }`
- **Functions**: camelCase
  - `function calculateXP() { ... }`
- **Constants**: UPPER_SNAKE_CASE
  - `const MAX_STREAK = 365;`

### Styling

- **Tailwind CSS** for styling
- **Responsive by default** (mobile-first)
- **Dark mode ready** (use Tailwind's dark: prefix)

```tsx
<div className="p-4 bg-white dark:bg-gray-800 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-2xl lg:text-3xl">Title</h1>
</div>
```

### Comments

- **Add JSDoc comments** for public functions
- **Explain WHY, not WHAT** in inline comments

```typescript
/**
 * Calculates XP based on task difficulty and completion time
 * @param difficulty - Task difficulty level
 * @param completionTime - Time taken in minutes
 * @returns XP amount
 */
function calculateXP(difficulty: string, completionTime: number): number {
  // Bonus XP for completing tasks quickly
  const speedBonus = completionTime < 30 ? 10 : 0;
  
  return baseXP[difficulty] + speedBonus;
}
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build process or tooling changes

### Examples

```bash
feat(gamification): add weekly goal tracking

Implemented weekly goal system with animated progress rings.
Users can now set and track weekly XP goals.

Closes #42

---

fix(streak): correct timezone handling for streak calculation

Previously, streaks were breaking due to timezone differences.
Now using UTC for storage and local timezone for display.

Fixes #38

---

docs(readme): update installation instructions

Added Firebase setup steps and troubleshooting section.
```

### Rules

- **Use present tense**: "add feature" not "added feature"
- **Use imperative mood**: "change" not "changes"
- **No period at the end** of subject line
- **Capitalize first letter** of subject
- **Limit subject to 50 characters**
- **Wrap body at 72 characters**

---

## Pull Request Process

### Before Creating PR

- [ ] Code follows style guidelines
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow convention

### Creating PR

1. **Title**: Use conventional commit format
   ```
   feat: add multi-goal support
   ```

2. **Description**: Use the template
   ```markdown
   ## Description
   Brief description of changes
   
   ## Motivation
   Why is this change needed?
   
   ## Changes
   - Added X feature
   - Fixed Y bug
   - Updated Z documentation
   
   ## Testing
   How was this tested?
   
   ## Screenshots (if applicable)
   Add screenshots for UI changes
   
   ## Related Issues
   Closes #42, Fixes #38
   ```

3. **Labels**: Add appropriate labels
   - `enhancement` - New features
   - `bug` - Bug fixes
   - `documentation` - Doc updates
   - `breaking change` - Breaking changes

### PR Review Process

- Maintainers will review within 2-3 days
- Address review comments
- Keep PR scope focused (one feature/fix per PR)
- Be responsive to feedback

### After PR is Merged

- Delete your feature branch
- Sync your fork with upstream
- Celebrate! 🎉

---

## Reporting Bugs

### Before Reporting

- Check if bug is already reported
- Verify bug exists in latest version
- Collect relevant information

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- Browser: Chrome 120
- OS: macOS 14
- Version: v1.0.0

**Additional Context**
Any other relevant information
```

---

## Feature Requests

We welcome feature ideas!

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
What other solutions did you consider?

**Additional Context**
Mockups, examples, etc.
```

---

## Development Tips

### Useful Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Debugging

```typescript
// Use console.log sparingly (remove before committing)
console.log('Debug:', value);

// Better: Use debugger statement
debugger;

// Best: Use React DevTools and browser debugger
```

### Firebase Emulator (Optional)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start
```

### Code Organization Tips

- **Keep components small** (< 200 lines)
- **Extract custom hooks** for reusable logic
- **Use services** for business logic
- **Keep repositories thin** (just data access)

---

## Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: contact@placementpilot.ai (if applicable)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PlacementPilot AI! 🚀
