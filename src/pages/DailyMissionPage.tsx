/**
 * DailyMissionPage
 *
 * Fix summary (Phase 7.2):
 *   - Mission persisted to MissionRepository on first generation — never lost
 *   - Changing day number loads existing mission from repo; only generates if absent
 *   - Checkbox state is optimistically updated then confirmed from persisted truth
 *   - XP awarded exactly once per task (guarded by persisted state)
 *   - Progress header shows live counts / XP / completion %
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate }          from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, BookOpen, Code2, RotateCcw,
  Trophy, Sparkles, Clock, CheckSquare, Square, Briefcase,
  Flame, Star, Zap,
} from 'lucide-react';
import { Button } from '../components/Button';
import { NoMissionEmptyState } from '../components/EmptyState';
import type { DailyMission, MissionTask }  from '../ai/dailyMission/dailyMission.schema';
import type { RoadmapWeek }                from '../ai/schemas/roadmap.schema';
import { generateDailyMission, formatMinutes } from '../ai/dailyMission/dailyMission';
import { useDayProgress }                  from '../hooks/useProgress';
import { useMissionRepository }            from '../hooks/useMissionRepository';
import type { Achievement }                from '../types/progress';

// ─── Router state ──────────────────────────────────────────────────────────────

interface DailyMissionLocationState {
  week:          RoadmapWeek;
  weeklyHours:   number;
  executionMode: string;
  roadmapTitle?: string;
  totalWeeks?:   number;   // for week unlock computation
}

// ─── Shared primitives ─────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="text-accent">{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {children}
      </h2>
    </div>
  );
}

function ProgressBar({ percent, color = 'bg-accent' }: { percent: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
}

// ─── Achievement toast ─────────────────────────────────────────────────────────

function AchievementToast({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 px-5 py-4 shadow-xl backdrop-blur animate-fade-up">
      <span className="text-2xl">{achievement.icon ?? '🏆'}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-success">Achievement Unlocked</p>
        <p className="text-sm font-bold text-text-primary">{achievement.title}</p>
        <p className="text-xs text-text-secondary">{achievement.description}</p>
      </div>
    </div>
  );
}

// ─── XP flash ─────────────────────────────────────────────────────────────────

function XPFlash({ amount, onDone }: { amount: number; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1000); return () => clearTimeout(t); }, [onDone]);
  return (
    <span className="pointer-events-none absolute -top-6 right-0 text-sm font-bold text-success animate-fade-up">
      +{amount} XP
    </span>
  );
}

// ─── Task row ──────────────────────────────────────────────────────────────────

function TaskRow({
  task, completed, onToggle, xpAmount = 10,
}: { task: MissionTask; completed: boolean; onToggle: () => void; xpAmount?: number }) {
  const [flash, setFlash] = useState(false);
  const iconMap: Record<MissionTask['type'], React.ReactNode> = {
    learning: <BookOpen  size={14} className="text-accent" />,
    practice: <Code2     size={14} className="text-warning" />,
    revision: <RotateCcw size={14} className="text-success" />,
    project:  <Briefcase size={14} className="text-accent" />,
  };
  return (
    <div
      onClick={() => { if (!completed) setFlash(true); onToggle(); }}
      className={[
        'relative group flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150',
        completed ? 'border-success/20 bg-success/5' : 'border-white/5 bg-bg-secondary hover:border-white/10 hover:bg-bg-card',
      ].join(' ')}
    >
      {flash && <XPFlash amount={xpAmount} onDone={() => setFlash(false)} />}
      <span className={`mt-0.5 shrink-0 transition-colors duration-150 ${completed ? 'text-success' : 'text-text-secondary/40 group-hover:text-accent/60'}`}>
        {completed ? <CheckSquare size={15} strokeWidth={2} /> : <Square size={15} strokeWidth={1.5} />}
      </span>
      <div className="flex flex-1 items-start justify-between gap-3">
        <p className={`text-sm transition-colors duration-150 ${completed ? 'text-text-secondary/60 line-through' : 'text-text-secondary group-hover:text-text-primary'}`}>
          {task.title}
        </p>
        <span className="flex shrink-0 items-center gap-1 text-xs text-text-secondary/50">
          <Clock size={10} />{formatMinutes(task.estimatedMinutes)}
        </span>
      </div>
      <span className="mt-0.5 shrink-0">{iconMap[task.type]}</span>
    </div>
  );
}

// ─── Day selector ──────────────────────────────────────────────────────────────

function DaySelector({ selected, onChange }: { selected: number; onChange: (d: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
        <button key={d} onClick={() => onChange(d)}
          className={['h-9 w-9 rounded-xl text-sm font-semibold transition-all duration-150',
            selected === d ? 'bg-accent text-white shadow-md shadow-accent/20'
              : 'border border-white/10 bg-bg-card text-text-secondary hover:border-accent/30 hover:text-text-primary',
          ].join(' ')}>
          {d}
        </button>
      ))}
    </div>
  );
}

// ─── DailyMissionPage ──────────────────────────────────────────────────────────

export default function DailyMissionPage() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const missionRepo  = useMissionRepository();

  // ── Restore state from sessionStorage if location.state is missing ──
  const locationState = location.state as DailyMissionLocationState | null;
  const [state, setState] = useState<DailyMissionLocationState | null>(() => {
    if (locationState) {
      // Save to sessionStorage for recovery
      sessionStorage.setItem('pp_daily_mission_state', JSON.stringify(locationState));
      return locationState;
    }
    // Try to recover from sessionStorage
    const saved = sessionStorage.getItem('pp_daily_mission_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DailyMissionLocationState;
        console.log('[DailyMissionPage] Restored state from sessionStorage');
        return parsed;
      } catch (e) {
        console.error('[DailyMissionPage] Failed to parse saved state:', e);
      }
    }
    return null;
  });

  // Update state when location.state changes
  useEffect(() => {
    if (locationState) {
      sessionStorage.setItem('pp_daily_mission_state', JSON.stringify(locationState));
      setState(locationState);
    }
  }, [locationState]);

  const [dayNumber,   setDayNumber]   = useState(1);
  const [mission,     setMission]     = useState<DailyMission | null>(null);
  const [generating,  setGenerating]  = useState(false);
  const [loadingMission, setLoadingMission] = useState(false);
  const [genError,    setGenError]    = useState(false);
  const [toastQueue,  setToastQueue]  = useState<Achievement[]>([]);

  console.log(`[DailyMissionPage] Component render - mission exists: ${!!mission}, dayNumber: ${dayNumber}, loading: ${loadingMission}, generating: ${generating}`);

  const roadmapTitle = state?.roadmapTitle ?? 'My Roadmap';
  const totalWeeks   = state?.totalWeeks ?? 1;

  // Progress hook — only active when a mission is loaded
  const { state: ps, toggleTask, recordMissionGenerated, clearNewlyUnlocked } =
    useDayProgress(state?.week.week ?? 1, dayNumber, mission, roadmapTitle, totalWeeks);

  // Show achievement toasts
  useEffect(() => {
    if (ps.newlyUnlocked.length === 0) return;
    setToastQueue((q) => [...q, ...ps.newlyUnlocked]);
    clearNewlyUnlocked();
  }, [ps.newlyUnlocked, clearNewlyUnlocked]);

  // ── Load existing mission from repo when day changes ──────────────────────
  useEffect(() => {
    if (!state) {
      console.log('[DailyMissionPage] No state available, skipping mission load');
      return;
    }
    
    let cancelled = false;
    async function loadExisting() {
      const weekNum = state!.week.week;
      console.log(`[DailyMissionPage] Loading mission for Week ${weekNum}, Day ${dayNumber}`);
      console.log(`[DailyMissionPage] Week data:`, { 
        weekNumber: weekNum, 
        weekTitle: state!.week.title,
        dayNumber: dayNumber
      });
      
      setLoadingMission(true);
      setMission(null);
      setGenError(false);
      
      try {
        const existing = await missionRepo.getMission(weekNum, dayNumber);
        console.log(`[DailyMissionPage] Mission lookup result:`, existing ? 'Found existing mission' : 'No mission found');
        
        if (!cancelled) {
          setMission(existing);     // null = not yet generated → show Generate button
          
          // If we found an existing mission, make sure it's tracked in roadmap progress
          if (existing) {
            await recordMissionGenerated(weekNum, dayNumber);
            console.log(`[DailyMissionPage] ✓ Loaded existing mission: "${existing.title}"`);
          } else {
            console.log(`[DailyMissionPage] No existing mission found - will show Generate button`);
          }
          
          setLoadingMission(false);
        }
      } catch (error) {
        console.error('[DailyMissionPage] Error loading mission:', error);
        if (!cancelled) {
          setMission(null);
          setLoadingMission(false);
        }
      }
    }
    loadExisting();
    return () => { cancelled = true; };
  }, [dayNumber, state?.week.week, missionRepo]);  // Removed recordMissionGenerated from dependencies

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
        <NoMissionEmptyState 
          onBackToRoadmap={() => navigate('/roadmap')}
        />
      </div>
    );
  }

  const { week, weeklyHours, executionMode } = state;

  // ── Generate once and persist ─────────────────────────────────────────────
  async function handleGenerate() {
    console.log(`[DailyMissionPage] Starting mission generation for Week ${week.week}, Day ${dayNumber}`);
    setGenerating(true);
    setGenError(false);
    
    try {
      const result = await generateDailyMission({ week, dayNumber, executionMode, weeklyHours });
      if (result.success && result.data) {
        console.log(`[DailyMissionPage] ✓ Mission generated successfully: "${result.data.title}"`);
        
        await missionRepo.saveMission(week.week, dayNumber, result.data);
        console.log(`[DailyMissionPage] ✓ Mission saved to repository`);
        
        setMission(result.data);
        
        // Record that this mission was generated for roadmap progress tracking
        await recordMissionGenerated(week.week, dayNumber);
        console.log(`[DailyMissionPage] ✓ Mission generation tracked in roadmap progress`);
      } else {
        console.error(`[DailyMissionPage] Mission generation failed:`, result);
        setGenError(true);
      }
    } catch (error) {
      console.error(`[DailyMissionPage] Error during mission generation:`, error);
      setGenError(true);
    }
    
    setGenerating(false);
  }

  const dp             = ps.dayProgress;
  const completedCount = dp?.tasks.filter((t) => t.completed).length ?? 0;
  const totalCount     = dp?.tasks.length ?? 0;
  const allDone        = totalCount > 0 && completedCount === totalCount;

  // Remaining time estimate
  const remainingMinutes = mission
    ? [
        ...( mission.learningTasks ?? []),
        ...( mission.practiceTasks ?? []),
        ...( mission.revisionTasks ?? []),
      ]
        .filter((t) => {
          const tc = dp?.tasks.find((x) => x.taskTitle === t.title);
          return !(tc?.completed);
        })
        .reduce((sum, t) => sum + t.estimatedMinutes, 0)
    : 0;

  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary">

      {/* Achievement toast */}
      {toastQueue.length > 0 && (
        <AchievementToast achievement={toastQueue[0]} onClose={() => setToastQueue((q) => q.slice(1))} />
      )}

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate('/roadmap')} className="flex items-center gap-2 text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary">
            <ArrowLeft size={16} /> Back to Roadmap
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Zap size={11} />{ps.totalXP} XP
            </div>
            {ps.streak.currentStreak > 0 && (
              <div className="flex items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                <Flame size={11} />{ps.streak.currentStreak}
              </div>
            )}
            <span className="text-sm font-semibold">PlacementPilot <span className="text-accent">AI</span></span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">

        {/* ── Hero ── */}
        <div className="mb-10 animate-fade-up">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Daily Mission</p>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Week {week.week} — {week.title}
          </h1>
        </div>

        {/* ── Live progress header (when mission loaded) ── */}
        {mission && (
          <div className="mb-6 grid gap-4 sm:grid-cols-4 animate-fade-up" style={{ animationDelay: '40ms' }}>
            <Card className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">Today's Progress</p>
              <p className="text-2xl font-bold text-text-primary">
                {completedCount}<span className="text-base font-normal text-text-secondary"> / {totalCount}</span>
              </p>
              <ProgressBar percent={dp?.completionPercent ?? 0} color={allDone ? 'bg-success' : 'bg-accent'} />
              {allDone && <span className="self-start rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">✓ Done</span>}
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">Today's XP</p>
              <p className="text-2xl font-bold text-accent">{ps.totalXP}</p>
              <ProgressBar percent={ps.levelInfo.progress} color="bg-accent" />
              <p className="text-xs text-text-secondary/50">Level {ps.levelInfo.level}</p>
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">Completion</p>
              <p className="text-2xl font-bold text-text-primary">{dp?.completionPercent ?? 0}%</p>
              <ProgressBar percent={dp?.completionPercent ?? 0} color="bg-accent" />
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">Est. Remaining</p>
              <p className="text-lg font-bold text-text-primary">{formatMinutes(remainingMinutes)}</p>
              <p className="text-xs text-text-secondary/50">of {mission.estimatedHours}h total</p>
            </Card>
          </div>
        )}

        {/* ── Day picker ── */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <Card>
            <p className="mb-4 text-sm font-medium text-text-secondary">Which day of the week are you on?</p>
            <DaySelector selected={dayNumber} onChange={(d) => setDayNumber(d)} />
            <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-secondary/50">
                Mode: <span className="font-medium text-text-secondary">{executionMode}</span>
                {' · '}Budget: <span className="font-medium text-text-secondary">{Math.round((weeklyHours / 5) * 10) / 10}h/day</span>
              </p>

              {/* Conditional button area */}
              {loadingMission ? (
                <span className="flex items-center gap-2 text-xs text-text-secondary/50">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
                  Loading…
                </span>
              ) : !mission ? (
                <Button
                  onClick={handleGenerate}
                  loading={generating}
                  disabled={generating}
                  size="md"
                >
                  {generating ? 'Generating...' : `Generate Day ${dayNumber} Mission`}
                </Button>
              ) : (
                <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                  ✓ Mission Ready (Previously Generated)
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* ── Generation error ── */}
        {genError && (
          <div className="mb-8 w-full rounded-2xl border border-danger/20 bg-danger/10 p-8 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3 text-danger" />
            <h2 className="text-lg font-bold text-text-primary">Failed to generate mission.</h2>
            <p className="mt-2 text-sm text-text-secondary">Gemini could not generate today's mission. Please try again.</p>
            <div className="mt-6">
              <Button onClick={handleGenerate} variant="primary">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* ── Mission content (visible as long as mission exists) ── */}
        {mission && !loadingMission && (
          <div className="flex flex-col gap-6 animate-fade-up">

            <Card className="border-accent/15 bg-accent/5 hover:border-accent/25">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">Today's Mission</p>
                  <h2 className="text-xl font-bold text-text-primary">{mission.title}</h2>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-bg-card px-3 py-2 text-sm font-semibold text-text-primary">
                  <Clock size={14} className="text-accent" />{mission.estimatedHours}h
                </div>
              </div>
            </Card>

            {/* Learning */}
            {mission.learningTasks.length > 0 && (
              <Card>
                <SectionHeading icon={<BookOpen size={15} />}>Learning</SectionHeading>
                <div className="flex flex-col gap-2">
                  {mission.learningTasks.map((task) => {
                    const tc = dp?.tasks.find((t) => t.taskTitle === task.title);
                    return <TaskRow 
                      key={`${task.title}-${tc?.completed ?? false}`} 
                      task={task} 
                      completed={tc?.completed ?? false}
                      onToggle={() => toggleTask(task.title, tc?.completed ?? false)} 
                    />;
                  })}
                </div>
              </Card>
            )}

            {/* Practice */}
            {mission.practiceTasks.length > 0 && (
              <Card>
                <SectionHeading icon={<Code2 size={15} />}>Practice</SectionHeading>
                <div className="flex flex-col gap-2">
                  {mission.practiceTasks.map((task) => {
                    const tc = dp?.tasks.find((t) => t.taskTitle === task.title);
                    return <TaskRow 
                      key={`${task.title}-${tc?.completed ?? false}`} 
                      task={task} 
                      completed={tc?.completed ?? false}
                      onToggle={() => toggleTask(task.title, tc?.completed ?? false)} 
                    />;
                  })}
                </div>
              </Card>
            )}

            {/* Revision */}
            {mission.revisionTasks.length > 0 && (
              <Card>
                <SectionHeading icon={<RotateCcw size={15} />}>Revision</SectionHeading>
                <div className="flex flex-col gap-2">
                  {mission.revisionTasks.map((task) => {
                    const tc = dp?.tasks.find((t) => t.taskTitle === task.title);
                    return <TaskRow 
                      key={`${task.title}-${tc?.completed ?? false}`} 
                      task={task} 
                      completed={tc?.completed ?? false}
                      onToggle={() => toggleTask(task.title, tc?.completed ?? false)} 
                    />;
                  })}
                </div>
              </Card>
            )}

            {/* Milestone */}
            <Card className="border-success/20 bg-success/5 hover:border-success/30">
              <SectionHeading icon={<Trophy size={15} />}>Today's Milestone</SectionHeading>
              <p className="text-sm text-text-primary">{mission.milestone}</p>
            </Card>

            {/* Motivation */}
            {mission.motivation && (
              <Card className="border-accent/10">
                <SectionHeading icon={<Sparkles size={15} />}>Motivation</SectionHeading>
                <p className="text-sm italic leading-relaxed text-text-secondary">{mission.motivation}</p>
              </Card>
            )}

            {/* Achievements */}
            {ps.achievements.length > 0 && (
              <Card>
                <SectionHeading icon={<Star size={15} />}>Achievements</SectionHeading>
                <div className="flex flex-wrap gap-2">
                  {ps.achievements.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 rounded-xl border border-white/8 bg-bg-secondary px-3 py-2">
                      <span className="text-base">{a.icon ?? '🏅'}</span>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{a.title}</p>
                        <p className="text-xs text-text-secondary/60">{a.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex flex-col items-center gap-3 pb-4 text-center">
              <Button 
                onClick={() => navigate('/roadmap')}
                variant="secondary"
              >
                ← Back to Roadmap
              </Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
