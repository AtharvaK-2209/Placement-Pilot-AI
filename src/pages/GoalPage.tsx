import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { AuthenticatedLayout } from '../components/AuthenticatedLayout';
import type {
  GoalInput,
  GoalType,
  SkillLevel,
  LearningStyle,
  Skill,
} from '../types/goal';
import { analyzeGoal } from '../ai/goalAnalysis';
import { executionPipelineEvents } from '../services/executionPipelineEvents';

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'placement',     label: 'Campus Placement'  },
  { value: 'internship',    label: 'Internship'         },
  { value: 'upskill',       label: 'Upskilling'         },
  { value: 'career-switch', label: 'Career Switch'      },
];

const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string; description: string }[] = [
  { value: 'beginner',     label: 'Beginner',     description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Know the basics'   },
  { value: 'advanced',     label: 'Advanced',     description: 'Strong foundation' },
];

const LEARNING_STYLE_OPTIONS: { value: LearningStyle; label: string; description: string }[] = [
  { value: 'visual',    label: 'Visual',     description: 'Diagrams & videos'      },
  { value: 'reading',   label: 'Reading',    description: 'Docs & articles'        },
  { value: 'hands-on',  label: 'Hands-on',  description: 'Build & practice'       },
  { value: 'mixed',     label: 'Mixed',      description: 'A bit of everything'    },
];

const ALL_SKILLS: Skill[] = [
  'DSA', 'Java', 'Spring Boot', 'SQL', 'DBMS',
  'Operating Systems', 'Computer Networks',
  'Aptitude', 'Communication', 'Projects',
];

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: GoalInput = {
  goal:          '',
  goalType:      'placement',
  deadline:      '',
  skillLevel:    'beginner',
  knownSkills:   [],
  weeklyHours:   10,
  learningStyle: 'hands-on',
  targetCompany: '',
};

// ─── Shared input classes ─────────────────────────────────────────────────────

const inputBase =
  'w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors duration-200 focus:border-accent/60 focus:ring-1 focus:ring-accent/30';

const labelBase = 'mb-2 block text-sm font-medium text-text-primary';

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={labelBase}>
      {children}
      {optional && (
        <span className="ml-2 text-xs font-normal text-text-secondary/60">
          optional
        </span>
      )}
    </label>
  );
}

// ─── GoalPage ─────────────────────────────────────────────────────────────────

export default function GoalPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<GoalInput>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function set<K extends keyof GoalInput>(key: K, value: GoalInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSkill(skill: Skill) {
    setForm((prev) => {
      const already = prev.knownSkills.includes(skill);
      return {
        ...prev,
        knownSkills: already
          ? prev.knownSkills.filter((s) => s !== skill)
          : [...prev.knownSkills, skill],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const goalInput: GoalInput = {
      ...form,
      targetCompany: form.targetCompany?.trim() || undefined,
    };

    setLoading(true);
    const result = await analyzeGoal(goalInput);
    setLoading(false);

    // Emit milestone event for goal analysis completion
    if (result.success && result.data) {
      console.log('[GoalPage] ✓ Goal analysis successful, emitting milestone event');
      await executionPipelineEvents.emit({
        type: 'goal_analysis_complete',
        timestamp: new Date().toISOString(),
        data: { goal: goalInput.goal },
      });
    }

    navigate('/analysis', { state: { result, goalInput } });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AuthenticatedLayout noPadding maxWidth="full">
      <div className="min-h-screen bg-bg-primary font-sans text-text-primary">

      {/* ── Form ── */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Contextual navigation */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Tell us about your goal
          </h1>
          <p className="mt-3 text-base text-text-secondary">
            Answer a few questions so our AI can build a personalized execution plan for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* ── 1. Goal ── */}
          <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
            <FieldLabel htmlFor="goal">What is your goal?</FieldLabel>
            <textarea
              id="goal"
              rows={3}
              required
              placeholder="e.g. Get a software engineering internship at a top product company"
              value={form.goal}
              onChange={(e) => set('goal', e.target.value)}
              className={`${inputBase} resize-none`}
            />
          </div>

          {/* ── 2. Goal Type + Deadline ── */}
          <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="goalType">Goal type</FieldLabel>
                <select
                  id="goalType"
                  required
                  value={form.goalType}
                  onChange={(e) => set('goalType', e.target.value as GoalType)}
                  className={inputBase}
                >
                  {GOAL_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="deadline">Target deadline</FieldLabel>
                <input
                  id="deadline"
                  type="date"
                  required
                  value={form.deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => set('deadline', e.target.value)}
                  className={`${inputBase} [color-scheme:dark]`}
                />
              </div>
            </div>
          </div>

          {/* ── 3. Skill Level ── */}
          <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
            <p className={labelBase}>Current skill level</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {SKILL_LEVEL_OPTIONS.map((o) => {
                const selected = form.skillLevel === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set('skillLevel', o.value)}
                    className={[
                      'flex flex-col rounded-xl border px-4 py-3.5 text-left transition-all duration-150',
                      selected
                        ? 'border-accent bg-accent/10 text-text-primary'
                        : 'border-white/8 bg-bg-secondary text-text-secondary hover:border-white/20 hover:text-text-primary',
                    ].join(' ')}
                  >
                    <span className="text-sm font-semibold">{o.label}</span>
                    <span className="mt-0.5 text-xs opacity-70">{o.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 4. Known Skills ── */}
          <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
            <p className={labelBase}>Skills you already know</p>
            <p className="mb-4 text-xs text-text-secondary/60">
              Select skills you have already mastered. These will be <span className="font-semibold text-warning">skipped</span> in your roadmap so you only study what you need.
              Leave all unselected if you want the full roadmap.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => {
                const selected = form.knownSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={[
                      'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150',
                      selected
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-white/10 bg-bg-secondary text-text-secondary hover:border-white/20 hover:text-text-primary',
                    ].join(' ')}
                  >
                    {selected && <X size={11} strokeWidth={2.5} />}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 5. Weekly Hours + Target Company ── */}
          <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="weeklyHours">Weekly study hours</FieldLabel>
                <input
                  id="weeklyHours"
                  type="number"
                  required
                  min={1}
                  max={80}
                  value={form.weeklyHours}
                  onChange={(e) =>
                    set('weeklyHours', Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className={inputBase}
                />
              </div>

              <div>
                <FieldLabel htmlFor="targetCompany" optional>
                  Target company
                </FieldLabel>
                <input
                  id="targetCompany"
                  type="text"
                  placeholder="e.g. Google, Amazon, Infosys"
                  value={form.targetCompany ?? ''}
                  onChange={(e) => set('targetCompany', e.target.value)}
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* ── 6. Learning Style ── */}
          <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
            <p className={labelBase}>How do you learn best?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {LEARNING_STYLE_OPTIONS.map((o) => {
                const selected = form.learningStyle === o.value;
                return (
                  <label
                    key={o.value}
                    className={[
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150',
                      selected
                        ? 'border-accent bg-accent/10'
                        : 'border-white/8 bg-bg-secondary hover:border-white/20',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="learningStyle"
                      value={o.value}
                      checked={selected}
                      onChange={() => set('learningStyle', o.value)}
                      className="accent-accent h-4 w-4 shrink-0"
                    />
                    <div>
                      <p className={`text-sm font-medium ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {o.label}
                      </p>
                      <p className="text-xs text-text-secondary/60">{o.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="flex flex-col items-center gap-3 pb-4">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0 sm:w-auto sm:px-16"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Analyzing Goal...' : 'Continue →'}
            </button>
            <p className="text-xs text-text-secondary/50">
              Your goal will be analyzed by AI in the next step.
            </p>
          </div>

        </form>
      </main>
    </div>
    </AuthenticatedLayout>
  );
}
