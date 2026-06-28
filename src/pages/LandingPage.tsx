import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Route,
  CalendarCheck,
  TrendingUp,
  LogIn,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth }  from '../contexts/AuthContext';
import { signOut }  from '../services/authService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  Icon: LucideIcon;
  title: string;
  description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    Icon: Target,
    title: 'Goal Analysis',
    description:
      'AI evaluates your career goal, estimates difficulty, assesses feasibility, and identifies skill gaps in seconds.',
  },
  {
    Icon: Route,
    title: 'Roadmap Generation',
    description:
      'Receive a personalized, week-by-week learning roadmap built around your schedule and skill level.',
  },
  {
    Icon: CalendarCheck,
    title: 'Daily Missions',
    description:
      'Stay on track with AI-generated daily study tasks that adapt to your progress and remaining timeline.',
  },
  {
    Icon: TrendingUp,
    title: 'Progress Tracking',
    description:
      'Visualize your execution health, monitor streaks, and get real-time accountability nudges.',
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Returns true once the referenced element has entered the viewport.
 * Used to trigger fade-up animations on feature cards.
 */
function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureCard({
  Icon,
  title,
  description,
  delay,
}: Feature & { delay: number }) {
  const [ref, visible] = useInView();

  return (
    <div
      ref={ref}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
      className={[
        'group flex flex-col gap-5 rounded-2xl bg-bg-card border border-white/5 p-8',
        'transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:-translate-y-1',
        visible ? 'animate-fade-up' : 'opacity-0',
      ].join(' ')}
    >
      {/* Icon container */}
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent/20">
        <Icon size={20} strokeWidth={1.75} />
      </div>

      <h3 className="text-base font-semibold text-text-primary tracking-tight">
        {title}
      </h3>

      <p className="text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary">

      {/* ── Nav ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-base font-semibold tracking-tight text-text-primary">
            PlacementPilot <span className="text-accent">AI</span>
          </span>
          <nav className="hidden items-center gap-8 text-sm text-text-secondary sm:flex">
            <a
              href="#features"
              className="transition-colors duration-200 hover:text-text-primary"
            >
              Features
            </a>
            <a
              href="#footer"
              className="transition-colors duration-200 hover:text-text-primary"
            >
              About
            </a>
            {user ? (
              <button
                onClick={async () => { await signOut(); }}
                className="flex items-center gap-1.5 text-text-secondary transition-colors duration-200 hover:text-danger"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-all duration-200 hover:bg-accent/20"
              >
                <LogIn size={13} />
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-32 text-center">

          {/* Badge — fade in */}
          <div
            className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent"
            style={{ animationDelay: '0ms' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Powered by Google Gemini
          </div>

          {/* Title — fade up */}
          <h1
            className="animate-fade-up max-w-4xl text-5xl font-extrabold leading-tight tracking-tighter text-text-primary sm:text-6xl lg:text-7xl"
            style={{ animationDelay: '80ms' }}
          >
            PlacementPilot{' '}
            <span className="text-accent">AI</span>
          </h1>

          {/* Subtitle — fade up, delayed */}
          <p
            className="animate-fade-up mt-6 max-w-2xl text-lg leading-8 text-text-secondary sm:text-xl"
            style={{ animationDelay: '200ms' }}
          >
            Your AI Career Execution Agent. Turn your dream career goal into a
            personalized execution plan powered by Google Gemini.
          </p>

          {/* CTAs — fade up, further delayed */}
          <div
            className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: '340ms' }}
          >
            <button
              onClick={() => navigate('/goal')}
              className="rounded-xl bg-accent px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0">
              Start Planning
            </button>
            <button className="rounded-xl border border-white/10 bg-bg-card px-8 py-3.5 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-white/20 hover:bg-bg-secondary hover:-translate-y-0.5 active:translate-y-0">
              Learn More
            </button>
          </div>

          {/* Scroll hint */}
          <div
            className="animate-fade-in mt-20 flex flex-col items-center gap-2 text-xs text-text-secondary/40"
            style={{ animationDelay: '600ms' }}
          >
            <span>Scroll to explore</span>
            <div className="h-6 w-px bg-gradient-to-b from-text-secondary/20 to-transparent" />
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="bg-bg-secondary px-6 py-28">
          <div className="mx-auto max-w-6xl">

            {/* Section header */}
            <div className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
                What you get
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                Everything you need to land the role
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-secondary max-w-lg mx-auto">
                PlacementPilot AI combines goal intelligence, adaptive planning,
                and daily execution into one cohesive workflow.
              </p>
            </div>

            {/* Cards grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, i) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  delay={i * 80}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="px-6 py-28">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/5 bg-bg-card p-12 text-center shadow-xl">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Ready to execute your goal?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              Stop planning in notebooks. Let AI build your roadmap, assign
              daily tasks, and keep you accountable — automatically.
            </p>
            <button
              onClick={() => navigate('/goal')}
              className="mt-10 rounded-xl bg-accent px-10 py-4 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 active:translate-y-0">
              Start Planning — It&apos;s Free
            </button>
            <p className="mt-4 text-xs text-text-secondary/50">
              No credit card required
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        id="footer"
        className="border-t border-white/5 bg-bg-primary px-6 py-12"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <span className="text-sm font-semibold text-text-primary">
            PlacementPilot <span className="text-accent">AI</span>
          </span>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-text-secondary sm:justify-end">
            <span>Powered by</span>
            {['Google Gemini', 'Firebase', 'React'].map((tech, i, arr) => (
              <span key={tech} className="flex items-center gap-3">
                <span className="font-medium text-text-primary">{tech}</span>
                {i < arr.length - 1 && (
                  <span className="text-white/10">·</span>
                )}
              </span>
            ))}
          </div>

          <p className="text-xs text-text-secondary/50">
            © {new Date().getFullYear()} PlacementPilot AI
          </p>
        </div>
      </footer>
    </div>
  );
}
