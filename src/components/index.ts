/**
 * @file index.ts
 * Phase 6B — Component exports for easier imports
 */

// UI Components
export * from './Button';
export * from './EmptyState';
export * from './ErrorBoundary';
export * from './LoadingSpinner';
export * from './SkeletonLoader';
export * from './Toast';
export { useToast } from './ToastProvider';
export { ToastProvider } from './ToastProvider';

// Existing components
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as GoalHealthCard } from './GoalHealthCard';
export { default as DeadlineRescueCard } from './DeadlineRescueCard';
export { default as ExecutionIntelligenceCard } from './ExecutionIntelligenceCard';

// Phase 6B — Animation components
export { AnimatedProgressBar, CircularProgress } from './AnimatedProgressBar';
export { AnimatedCounter } from './AnimatedCounter';
export { XPPopup } from './XPPopup';
export { PageTransition } from './PageTransition';
export { AnimatedCard } from './AnimatedCard';
