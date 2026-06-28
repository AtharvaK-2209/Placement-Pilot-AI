export type GoalType =
  | 'placement'
  | 'internship'
  | 'upskill'
  | 'career-switch';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningStyle =
  | 'visual'
  | 'reading'
  | 'hands-on'
  | 'mixed';

export type Skill =
  | 'DSA'
  | 'Java'
  | 'Spring Boot'
  | 'SQL'
  | 'DBMS'
  | 'Operating Systems'
  | 'Computer Networks'
  | 'Aptitude'
  | 'Communication'
  | 'Projects';

export interface GoalInput {
  /** The primary goal description entered by the user */
  goal: string;

  /** Category of the goal */
  goalType: GoalType;

  /** Target date to achieve the goal (ISO 8601 date string, e.g. "2025-12-31") */
  deadline: string;

  /** Self-assessed current skill level */
  skillLevel: SkillLevel;

  /** Technologies / subjects the user already knows */
  knownSkills: Skill[];

  /** Hours per week the user can dedicate to learning */
  weeklyHours: number;

  /** Preferred style of learning */
  learningStyle: LearningStyle;

  /** Optional company the user is targeting */
  targetCompany?: string;
}
