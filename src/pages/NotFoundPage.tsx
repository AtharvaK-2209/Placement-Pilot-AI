/**
 * @file NotFoundPage.tsx
 * Phase 6A — Custom 404 page with branding
 */

import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
      <div className="max-w-lg text-center">
        {/* 404 Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="text-9xl font-extrabold text-white/5">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search size={64} className="text-accent/40" />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="mb-4">
          <h1 className="mb-2 text-3xl font-bold text-text-primary">
            Page Not Found
          </h1>
          <p className="text-lg text-text-secondary">
            Oops! Looks like you've wandered off the roadmap.
          </p>
        </div>

        {/* Description */}
        <p className="mb-8 text-sm text-text-secondary/70">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track with{' '}
          <span className="font-semibold text-accent">PlacementPilot AI</span>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home size={16} />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-bg-card px-6 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-white/20 hover:bg-bg-secondary hover:-translate-y-0.5"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 border-t border-white/5 pt-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-text-secondary/60">
            Quick Links
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => navigate('/goal')}
              className="text-text-secondary transition-colors hover:text-accent"
            >
              Set Goal
            </button>
            <span className="text-text-secondary/30">•</span>
            <button
              onClick={() => navigate('/roadmap')}
              className="text-text-secondary transition-colors hover:text-accent"
            >
              Roadmap
            </button>
            <span className="text-text-secondary/30">•</span>
            <button
              onClick={() => navigate('/daily-mission')}
              className="text-text-secondary transition-colors hover:text-accent"
            >
              Daily Mission
            </button>
            <span className="text-text-secondary/30">•</span>
            <button
              onClick={() => navigate('/future-you')}
              className="text-text-secondary transition-colors hover:text-accent"
            >
              Future You
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
