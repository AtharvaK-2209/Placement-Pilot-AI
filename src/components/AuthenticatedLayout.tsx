/**
 * @file AuthenticatedLayout.tsx
 *
 * Layout wrapper for all authenticated pages.
 * Provides consistent structure with persistent navigation header.
 *
 * Features:
 *   - Global AppHeader (navigation)
 *   - Responsive container
 *   - Smooth page transitions
 *   - Consistent spacing
 */

import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  /** Optional: Remove default padding for custom layouts */
  noPadding?: boolean;
  /** Optional: Custom max width (default: 7xl) */
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl';
}

export function AuthenticatedLayout({
  children,
  noPadding = false,
  maxWidth = '7xl',
}: AuthenticatedLayoutProps) {
  const maxWidthClass = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Global Navigation Header */}
      <AppHeader />

      {/* Main Content Area */}
      <main
        className={[
          'mx-auto',
          maxWidthClass,
          noPadding ? '' : 'px-6 py-8',
        ].join(' ')}
      >
        {children}
      </main>
    </div>
  );
}
