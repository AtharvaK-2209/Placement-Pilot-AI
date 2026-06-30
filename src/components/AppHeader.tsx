/**
 * @file AppHeader.tsx
 *
 * Global persistent navigation header for authenticated pages.
 * Appears on every page after login as the central navigation hub.
 *
 * Navigation:
 *   - Dashboard (home icon)
 *   - Roadmap
 *   - Today (daily mission)
 *   - Achievements
 *
 * Status Indicators:
 *   - Current Streak (🔥)
 *   - Total XP (⚡)
 *   - Sign Out button
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useGamification } from '../hooks/useGamification';
import { signOut } from '../services/authService';
import {
  Home,
  Map,
  Calendar,
  Trophy,
  Flame,
  Zap,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
  activePattern?: RegExp;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: Home, activePattern: /^\/(dashboard)?$/ },
  { label: 'Roadmap', path: '/roadmap', icon: Map, activePattern: /^\/roadmap/ },
  { label: 'Today', path: '/daily-mission', icon: Calendar, activePattern: /^\/daily-mission/ },
  { label: 'Achievements', path: '/gamification', icon: Trophy, activePattern: /^\/gamification/ },
];

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const gamification = useGamification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (item: NavItem): boolean => {
    if (item.activePattern) {
      return item.activePattern.test(location.pathname);
    }
    return location.pathname === item.path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-bg-primary">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo / Brand */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => handleNavigation('/dashboard')}
            className="flex items-center gap-2 text-xl font-bold text-text-primary transition-colors hover:text-accent"
          >
            <span className="text-accent">✨</span>
            <span className="hidden sm:inline">PlacementPilot AI</span>
            <span className="sm:hidden">PP AI</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={[
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
                  ].join(' ')}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Stats + Sign Out */}
        <div className="flex items-center gap-4">
          {/* Status Indicators */}
          {!gamification.loading && gamification.data && (
            <div className="hidden items-center gap-3 lg:flex">
              {/* Streak */}
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-bg-secondary px-3 py-1.5">
                <Flame size={14} className="text-warning" />
                <span className="text-sm font-bold text-text-primary">
                  {gamification.data.streak.currentStreak}
                </span>
                <span className="text-xs text-text-secondary">day{gamification.data.streak.currentStreak !== 1 ? 's' : ''}</span>
              </div>

              {/* XP */}
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-bg-secondary px-3 py-1.5">
                <Zap size={14} className="text-accent" />
                <span className="text-sm font-bold text-text-primary">
                  {gamification.data.totalXP.toLocaleString()}
                </span>
                <span className="text-xs text-text-secondary">XP</span>
              </div>
            </div>
          )}

          {/* Sign Out Button (Desktop) */}
          <button
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-lg border border-white/10 bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-danger/30 hover:bg-danger/10 hover:text-danger md:flex"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-lg border border-white/10 bg-bg-secondary p-2 text-text-secondary transition-colors hover:text-text-primary md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/5 bg-bg-card md:hidden">
          <div className="px-6 py-4">
            {/* Mobile Navigation Items */}
            <div className="mb-4 flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={[
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-left font-medium transition-all',
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
                    ].join(' ')}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Stats */}
            {!gamification.loading && gamification.data && (
              <div className="mb-4 flex gap-2">
                <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-bg-secondary py-2">
                  <Flame size={14} className="text-warning" />
                  <span className="text-sm font-bold text-text-primary">
                    {gamification.data.streak.currentStreak}
                  </span>
                  <span className="text-xs text-text-secondary">day{gamification.data.streak.currentStreak !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-bg-secondary py-2">
                  <Zap size={14} className="text-accent" />
                  <span className="text-sm font-bold text-text-primary">
                    {gamification.data.totalXP.toLocaleString()}
                  </span>
                  <span className="text-xs text-text-secondary">XP</span>
                </div>
              </div>
            )}

            {/* Mobile Sign Out */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 font-medium text-danger transition-colors hover:border-danger/30"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
