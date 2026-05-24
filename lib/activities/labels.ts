import type { ActivityType } from '../../store/sessionStore';

export const ACTIVITY_LABELS: { key: ActivityType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reaction', label: 'Reaction' },
  { key: 'sound', label: 'Sound' },
  { key: 'earthquake', label: 'Earthquake' },
  { key: 'humanperf', label: 'Human perf' },
  { key: 'parachute', label: 'Parachute' },
  { key: 'handfan', label: 'Hand fan' },
  { key: 'breathing', label: 'Breathing' },
];

export function activityDisplayName(activityType: string): string {
  const found = ACTIVITY_LABELS.find((f) => f.key === activityType);
  return found?.label ?? activityType;
}
