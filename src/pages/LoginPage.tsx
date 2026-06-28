import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, AlertTriangle } from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
} from '../services/authService';
import { migrateLocalStorageToFirestore } from '../services/migrationService';

type Mode = 'signin' | 'register';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/5 bg-bg-card p-8">
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors duration-200 focus:border-accent/60 focus:ring-1 focus:ring-accent/30';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode,     setMode]     = useState<Mode>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function afterAuth(uid: string) {
    // Run one-time migration from localStorage → Firestore
    await migrateLocalStorageToFirestore(uid);
    navigate('/');
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      await afterAuth(user.uid);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = mode === 'signin'
        ? await signInWithEmail(email, password)
        : await registerWithEmail(email, password);
      await afterAuth(user.uid);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6 font-sans">
      <div className="flex w-full max-w-md flex-col items-center gap-8">

        {/* Brand */}
        <div className="text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Zap size={24} className="text-accent" />
            <span className="text-xl font-bold text-text-primary">
              PlacementPilot <span className="text-accent">AI</span>
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            {mode === 'signin' ? 'Sign in to continue your journey.' : 'Create your account to get started.'}
          </p>
        </div>

        <Card>
          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger" />
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-bg-secondary px-4 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-white/20 hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs text-text-secondary/50">or</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputCls} pl-9`}
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pl-9`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Mode toggle */}
          <p className="mt-5 text-center text-xs text-text-secondary/60">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setError(null); }}
              className="font-semibold text-accent hover:underline"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {/* Continue without sign in */}
          <p className="mt-3 text-center text-xs text-text-secondary/40">
            <button
              onClick={() => navigate('/')}
              className="hover:text-text-secondary"
            >
              Continue without signing in →
            </button>
          </p>
        </Card>

      </div>
    </div>
  );
}
