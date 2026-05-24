import { activityDisplayName } from '../activities/labels';
import { formatLeaderboardDisplay } from '../leaderboard/formatLeaderRow';
import type { ExperimentRecord } from '../../services/experimentsData';

function num(payload: Record<string, unknown>, key: string): number | undefined {
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function str(payload: Record<string, unknown>, key: string): string | undefined {
  const v = payload[key];
  return v != null ? String(v) : undefined;
}

function formatDate(ts: number): string {
  if (!ts) return 'Unknown date';
  return new Date(ts).toLocaleString();
}

function formatReflection(reflection: unknown): string[] {
  if (!reflection || typeof reflection !== 'object' || Array.isArray(reflection)) return [];
  const lines: string[] = [];
  for (const [key, value] of Object.entries(reflection as Record<string, unknown>)) {
    if (value == null || value === '') continue;
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    lines.push(`${label}: ${String(value)}`);
  }
  return lines;
}

function activityBody(record: ExperimentRecord): string[] {
  const { activityType, score, payload } = record;
  const display = formatLeaderboardDisplay(activityType, score, payload);
  const lines: string[] = [`Score: ${display.scoreText}`, `Summary: ${display.detail}`, ''];

  switch (activityType) {
    case 'sound': {
      const peak = num(payload, 'peakDb');
      const avg = num(payload, 'avgDb');
      if (peak != null) lines.push(`Peak dB: ${Math.round(peak)}`);
      if (avg != null) lines.push(`Average dB: ${Math.round(avg)}`);
      const addr = str(payload, 'address');
      if (addr) lines.push(`Location: ${addr}`);
      const captures = payload.captures;
      if (Array.isArray(captures) && captures.length) {
        lines.push('', 'Captures:');
        for (const c of captures) {
          const row = c as Record<string, unknown>;
          const label = str(row, 'actionLabel') ?? 'Reading';
          const db = num(row, 'peakDb');
          lines.push(`  • ${label}: ${db != null ? `${Math.round(db)} dB` : '—'}`);
        }
      }
      lines.push(...formatReflection(payload.reflection).map((l) => (l.startsWith(' ') ? l : l)));
      break;
    }
    case 'handfan': {
      const material = str(payload, 'material');
      if (material) lines.push(`Material: ${material}`);
      const trials = payload.trials;
      if (Array.isArray(trials) && trials.length) {
        lines.push('', 'Trials:');
        for (const t of trials) {
          const row = t as Record<string, unknown>;
          const design = row.design ?? '?';
          const dist = row.distanceCm ?? '?';
          const predicted = num(row, 'predictedAngleDeg');
          const actual = num(row, 'actualAngleDeg');
          lines.push(
            `  • Design ${design}, ${dist} cm: predicted ${predicted ?? '—'}°, actual ${actual ?? '—'}°`,
          );
        }
      }
      const force = payload.forceCalculation;
      if (force && typeof force === 'object' && !Array.isArray(force)) {
        const f = force as Record<string, unknown>;
        lines.push('', 'Force calculation:');
        if (f.stiffnessLabel) lines.push(`  Stiffness: ${String(f.stiffnessLabel)}`);
        if (f.forceN != null) lines.push(`  Force: ${String(f.forceN)} N`);
      }
      lines.push(...formatReflection(payload.reflection));
      break;
    }
    case 'parachute': {
      if (num(payload, 'massKg') != null) lines.push(`Mass: ${payload.massKg} kg`);
      const runs = payload.runs;
      if (Array.isArray(runs) && runs.length) {
        lines.push('', 'Runs:');
        for (const r of runs) {
          const row = r as Record<string, unknown>;
          const name = str(row, 'designName') ?? str(row, 'tabKey') ?? 'Run';
          const vel = num(row, 'finalVelocityMps');
          const g = num(row, 'gForce');
          lines.push(
            `  • ${name}: velocity ${vel != null ? vel.toFixed(2) : '—'} m/s, g-force ${g != null ? g.toFixed(2) : '—'}`,
          );
        }
      }
      lines.push(...formatReflection(payload.reflection));
      break;
    }
    case 'reaction': {
      const avgMs = num(payload, 'avgReactionMs');
      const trace = num(payload, 'traceScore');
      if (avgMs != null) lines.push(`Average reaction: ${Math.round(avgMs)} ms`);
      if (trace != null) lines.push(`Trace score: ${Math.round(trace)}`);
      const times = payload.reactionTimesMs;
      if (Array.isArray(times) && times.length) {
        lines.push(`Reaction times (ms): ${times.map((t) => Math.round(Number(t))).join(', ')}`);
      }
      break;
    }
    case 'earthquake': {
      const designs = payload.designs;
      if (Array.isArray(designs) && designs.length) {
        const summary = payload.summary as Record<string, unknown> | undefined;
        const bestPeak =
          num(payload, 'bestPeakCm') ?? (summary ? num(summary, 'bestPeakCm') : undefined);
        if (bestPeak != null) lines.push(`Best peak displacement: ${bestPeak.toFixed(2)} cm`);
        if (summary?.bestDesign != null) lines.push(`Best design: Design ${summary.bestDesign}`);
        for (const d of designs as Record<string, unknown>[]) {
          const readings = d.readings as Record<string, unknown> | undefined;
          const peak = readings ? num(readings, 'peakDisplacementCm') : undefined;
          lines.push(
            `Design ${d.design}: ${peak != null ? `${peak.toFixed(2)} cm` : '—'} (${readings?.rating ?? '—'})`,
          );
        }
        const reflection = payload.reflection as Record<string, unknown> | undefined;
        if (reflection?.bestDesignWhy) lines.push(`Best design why: ${reflection.bestDesignWhy}`);
        if (reflection?.surprises) lines.push(`Surprises: ${reflection.surprises}`);
      } else {
        const rms = num(payload, 'rmsG');
        if (rms != null) lines.push(`Wobble (RMS): ${rms.toFixed(3)} g`);
        if (num(payload, 'sampleCount') != null) lines.push(`Samples: ${payload.sampleCount}`);
      }
      break;
    }
    case 'humanperf': {
      const attempts = payload.attempts;
      if (Array.isArray(attempts) && attempts.length) {
        const summary = payload.summary as Record<string, unknown> | undefined;
        if (summary?.hardestMovementLabel) {
          lines.push(`Hardest movement: ${summary.hardestMovementLabel}`);
        }
        lines.push('', 'Movements:');
        for (const a of attempts as Record<string, unknown>[]) {
          const label = str(a, 'movementLabel') ?? `Movement ${a.movement ?? '?'}`;
          const avg = num(a, 'avgJerkMm');
          const rating = str(a, 'smoothnessRating');
          lines.push(
            `  • ${label}: avg ${avg != null ? `${avg.toFixed(1)} mm` : '—'} (${rating ?? '—'})`,
          );
        }
        lines.push(...formatReflection(payload.reflection));
      } else {
        const jerk = num(payload, 'jerkRms');
        if (jerk != null) lines.push(`Jerk RMS: ${jerk.toFixed(2)}`);
        if (num(payload, 'sampleCount') != null) lines.push(`Samples: ${payload.sampleCount}`);
      }
      break;
    }
    case 'breathing': {
      const bpm = num(payload, 'bpm') ?? score;
      lines.push(`Breathing rate: ${Math.round(bpm)} bpm`);
      if (num(payload, 'peakCount') != null) lines.push(`Peaks detected: ${payload.peakCount}`);
      break;
    }
    default:
      break;
  }

  if (lines.length <= 3) {
    const extras = Object.entries(payload)
      .filter(
        ([k]) => !['teamName', 'activityType', 'score', 'submittedAt', 'updatedAt'].includes(k),
      )
      .slice(0, 8)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
    if (extras.length) {
      lines.push('', 'Raw data:', ...extras.map((e) => `  ${e}`));
    }
  }

  return lines;
}

export function formatExperimentText(record: ExperimentRecord): string {
  const student = record.studentFirstName?.trim() || 'Student';
  const activity = activityDisplayName(record.activityType);
  const header = [
    'Ocupulse Experiment Report',
    '========================',
    `Activity: ${activity}`,
    `Student: ${student}`,
    `Team: ${record.teamName}`,
    `Date: ${formatDate(record.submittedAt)}`,
    `Session: ${record.sessionId}`,
    '',
  ];
  return [...header, ...activityBody(record)].join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatExperimentHtml(record: ExperimentRecord): string {
  const text = formatExperimentText(record);
  const body = escapeHtml(text)
    .split('\n')
    .map((line) =>
      line.length
        ? `<p style="margin:4px 0;font-family:sans-serif;font-size:13px;">${line}</p>`
        : '<br/>',
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Ocupulse — ${escapeHtml(activityDisplayName(record.activityType))}</title>
</head>
<body style="padding:24px;color:#111;">
  <h1 style="font-family:sans-serif;font-size:20px;margin-bottom:8px;">Ocupulse Experiment Report</h1>
  ${body}
</body>
</html>`;
}
