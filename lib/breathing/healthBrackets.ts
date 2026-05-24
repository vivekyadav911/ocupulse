import type { GradeLevel } from '../../store/sessionStore';
import type { BreathingStateId } from './sessionState';
import { breathingStateShortLabel } from './sessionState';

export type AgeBreathingBracket = {
  ageLabel: string;
  approxAgeYears: number;
  healthyRestMin: number;
  healthyRestMax: number;
  postExerciseNote: string;
};

export type BreathingHealthCategory =
  | 'below healthy'
  | 'healthy'
  | 'above healthy'
  | 'elevated (expected)';

export type BreathingStateHealthRow = {
  stateId: BreathingStateId;
  stateLabel: string;
  bpm: number;
  category: BreathingHealthCategory;
  detail: string;
};

export type BreathingHealthReport = {
  bracket: AgeBreathingBracket;
  rows: BreathingStateHealthRow[];
  overallSummary: string;
};

const GRADE_AGE: Record<GradeLevel, number> = {
  'Year 3': 8,
  'Year 4': 9,
  'Year 5': 10,
  'Year 6': 11,
  'Year 7': 12,
  'Year 8': 13,
  'Year 9': 14,
  'Year 10': 15,
  'High School': 16,
};

export function approxAgeFromGrade(gradeLevel: GradeLevel | string): number {
  return GRADE_AGE[gradeLevel as GradeLevel] ?? 12;
}

/** Age-adjusted healthy resting respiratory rate (breaths/min). Sources: AAP / pediatric norms. */
export function ageBreathingBracket(gradeLevel: GradeLevel | string): AgeBreathingBracket {
  const age = approxAgeFromGrade(gradeLevel);

  if (age <= 11) {
    return {
      ageLabel: `~${age} years (primary school)`,
      approxAgeYears: age,
      healthyRestMin: 18,
      healthyRestMax: 25,
      postExerciseNote: 'After exercise, 25–35 BPM is common while recovering.',
    };
  }

  return {
    ageLabel: `~${age} years (adolescent)`,
    approxAgeYears: age,
    healthyRestMin: 12,
    healthyRestMax: 20,
    postExerciseNote: 'After exercise, 20–30 BPM is common while recovering.',
  };
}

function classifyRestBpm(
  bpm: number,
  bracket: AgeBreathingBracket,
): Pick<BreathingStateHealthRow, 'category' | 'detail'> {
  if (bpm < bracket.healthyRestMin) {
    return {
      category: 'below healthy',
      detail: `Below the healthy resting range (${bracket.healthyRestMin}–${bracket.healthyRestMax} BPM) for your age.`,
    };
  }
  if (bpm <= bracket.healthyRestMax) {
    return {
      category: 'healthy',
      detail: `Within the healthy resting range (${bracket.healthyRestMin}–${bracket.healthyRestMax} BPM) for your age.`,
    };
  }
  if (bpm <= bracket.healthyRestMax + 8) {
    return {
      category: 'above healthy',
      detail: `Slightly above the typical resting range (${bracket.healthyRestMin}–${bracket.healthyRestMax} BPM) — may reflect recent activity or measurement conditions.`,
    };
  }
  return {
    category: 'above healthy',
    detail: `Well above the healthy resting range (${bracket.healthyRestMin}–${bracket.healthyRestMax} BPM) for your age.`,
  };
}

function classifyExerciseBpm(
  bpm: number,
  restBpm: number | null,
  bracket: AgeBreathingBracket,
): Pick<BreathingStateHealthRow, 'category' | 'detail'> {
  const aboveRest = restBpm != null && bpm > restBpm;
  if (aboveRest) {
    return {
      category: 'elevated (expected)',
      detail: `Elevated above your resting ${restBpm!.toFixed(1)} BPM — expected after exercise. ${bracket.postExerciseNote}`,
    };
  }
  if (bpm >= bracket.healthyRestMin && bpm <= bracket.healthyRestMax + 10) {
    return {
      category: 'healthy',
      detail: `Returned near resting levels. ${bracket.postExerciseNote}`,
    };
  }
  return {
    category: 'above healthy',
    detail: `Higher than typical post-exercise recovery. ${bracket.postExerciseNote}`,
  };
}

export function buildBreathingHealthReport(
  gradeLevel: GradeLevel | string,
  readings: Partial<Record<BreathingStateId, { bpm: number } | null | undefined>>,
): BreathingHealthReport {
  const bracket = ageBreathingBracket(gradeLevel);
  const restBpm = readings.rest?.bpm ?? null;

  const stateOrder: BreathingStateId[] = ['rest', 'jog', 'starJumps'];
  const rows: BreathingStateHealthRow[] = [];

  for (const stateId of stateOrder) {
    const rec = readings[stateId];
    if (!rec) continue;

    const classified =
      stateId === 'rest'
        ? classifyRestBpm(rec.bpm, bracket)
        : classifyExerciseBpm(rec.bpm, restBpm, bracket);

    rows.push({
      stateId,
      stateLabel: breathingStateShortLabel(stateId),
      bpm: rec.bpm,
      ...classified,
    });
  }

  const restRow = rows.find((r) => r.stateId === 'rest');
  let overallSummary: string;

  if (!restRow) {
    overallSummary = `Healthy resting breathing for ${bracket.ageLabel} is typically ${bracket.healthyRestMin}–${bracket.healthyRestMax} BPM.`;
  } else if (restRow.category === 'healthy') {
    overallSummary = `At rest, your ${restRow.bpm.toFixed(1)} BPM falls within the healthy range for ${bracket.ageLabel} (${bracket.healthyRestMin}–${bracket.healthyRestMax} BPM).`;
  } else if (restRow.category === 'below healthy') {
    overallSummary = `At rest, your ${restRow.bpm.toFixed(1)} BPM is below the typical healthy range for ${bracket.ageLabel} (${bracket.healthyRestMin}–${bracket.healthyRestMax} BPM). Try a longer, still recording if breathing was very slow.`;
  } else {
    overallSummary = `At rest, your ${restRow.bpm.toFixed(1)} BPM is above the typical healthy range for ${bracket.ageLabel} (${bracket.healthyRestMin}–${bracket.healthyRestMax} BPM).`;
  }

  const jogRow = rows.find((r) => r.stateId === 'jog');
  if (jogRow && restRow) {
    overallSummary += ` After jogging, breathing rose to ${jogRow.bpm.toFixed(1)} BPM.`;
  }

  return { bracket, rows, overallSummary };
}

export function healthCategoryColor(category: BreathingHealthCategory): string {
  switch (category) {
    case 'below healthy':
      return '#4A90D9';
    case 'healthy':
      return '#50C878';
    case 'above healthy':
      return '#E8A838';
    case 'elevated (expected)':
      return '#9B59B6';
  }
}
