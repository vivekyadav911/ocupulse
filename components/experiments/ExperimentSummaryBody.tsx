import type { ExperimentRecord } from '../../services/experimentsData';
import { activityDisplayName } from '../../lib/activities/labels';
import { formatLeaderboardDisplay } from '../../lib/leaderboard/formatLeaderRow';
import { parseSoundPayload } from '../../lib/sound/parseSoundPayload';
import {
  markerColorForPeakDb,
  pollutionTierForPeakDb,
  pollutionTierLabel,
} from '../../lib/calc/soundLevel';
import { StatReadout } from '../StatReadout';
import { StemmMap } from '../StemmMap';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../../theme/themedStyles';

type ExperimentSummaryBodyProps = {
  record: ExperimentRecord;
};

function num(payload: Record<string, unknown>, key: string): number | undefined {
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function ExperimentSummaryBody({ record }: ExperimentSummaryBodyProps) {
  const { activityType, score, payload } = record;
  const display = formatLeaderboardDisplay(activityType, score, payload);
  const styles = useThemedStyles((t) => ({
    activity: {
      fontSize: t.typography.caption,
      fontWeight: '700',
      color: t.colors.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
      marginBottom: t.spacing.xs,
    },
    title: {
      fontSize: t.typography.subtitle,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.md,
    },
    meta: { color: t.colors.muted, marginBottom: t.spacing.md, lineHeight: 20 },
    tierBadge: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radii.xl,
      borderWidth: 1,
      marginBottom: t.spacing.sm,
    },
    tierText: { fontSize: t.typography.caption, fontWeight: '800' as const },
    addr: { color: t.colors.muted, marginBottom: t.spacing.md },
    map: {
      width: '100%' as const,
      height: 160,
      borderRadius: t.radii.lg,
      marginBottom: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    section: { color: t.colors.muted, marginTop: t.spacing.sm, marginBottom: t.spacing.xs },
    line: { color: t.colors.text, marginBottom: 4, lineHeight: 20 },
  }));

  const dateStr = record.submittedAt
    ? new Date(record.submittedAt).toLocaleString()
    : 'Unknown date';

  const soundPayload =
    activityType === 'sound' && record.payload
      ? parseSoundPayload(JSON.stringify(record.payload))
      : null;

  return (
    <>
      <Text style={styles.activity}>{activityDisplayName(activityType)}</Text>
      <Text style={styles.title}>{display.scoreText}</Text>
      <Text style={styles.meta}>
        {record.studentFirstName ? `${record.studentFirstName} · ` : ''}
        {record.teamName} · {dateStr}
      </Text>
      <StatReadout label="Summary" value={display.detail} />

      {activityType === 'sound' && soundPayload ? (
        <>
          {(() => {
            const tier = soundPayload.pollutionTier ?? pollutionTierForPeakDb(soundPayload.peakDb);
            const tierColor = markerColorForPeakDb(soundPayload.peakDb);
            return (
              <View
                style={[
                  styles.tierBadge,
                  { borderColor: tierColor, backgroundColor: `${tierColor}22` },
                ]}
              >
                <Text style={[styles.tierText, { color: tierColor }]}>
                  {pollutionTierLabel(tier)}
                </Text>
              </View>
            );
          })()}
          <StatReadout label="Peak dB" value={`${Math.round(soundPayload.peakDb)} dB`} />
          <StatReadout label="Avg dB" value={`${Math.round(soundPayload.avgDb)} dB`} />
          <Text style={styles.addr}>{soundPayload.address || 'Location saved'}</Text>
          <StemmMap
            style={styles.map}
            initialRegion={{
              latitude: soundPayload.lat,
              longitude: soundPayload.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            markers={[
              {
                id: record.sessionId,
                latitude: soundPayload.lat,
                longitude: soundPayload.lng,
                pinColor: markerColorForPeakDb(soundPayload.peakDb),
                title: `${Math.round(soundPayload.peakDb)} dB peak`,
                description: soundPayload.address,
              },
            ]}
          />
        </>
      ) : null}

      {activityType === 'reaction' ? (
        <>
          <StatReadout
            label="Avg reaction"
            value={`${Math.round(num(payload, 'avgReactionMs') ?? 0)} ms`}
          />
          <StatReadout label="Trace score" value={`${num(payload, 'traceScore') ?? '—'}`} />
        </>
      ) : null}

      {activityType === 'earthquake' ? (
        Array.isArray(payload.designs) ? (
          <>
            <StatReadout
              label="Best peak displacement"
              value={`${(num(payload, 'bestPeakCm') ?? num(payload.summary as Record<string, unknown>, 'bestPeakCm') ?? 0).toFixed(2)} cm`}
            />
            {payload.summary && typeof payload.summary === 'object' ? (
              <StatReadout
                label="Best design"
                value={
                  (payload.summary as Record<string, unknown>).bestDesign != null
                    ? `Design ${String((payload.summary as Record<string, unknown>).bestDesign)}`
                    : '—'
                }
              />
            ) : null}
            <Text style={styles.section}>Designs ({(payload.designs as unknown[]).length})</Text>
            {(payload.designs as Record<string, unknown>[]).map((d, i) => (
              <Text key={i} style={styles.line}>
                Design {String(d.design)}:{' '}
                {typeof (d.readings as Record<string, unknown>)?.peakDisplacementCm === 'number'
                  ? `${(d.readings as Record<string, unknown>).peakDisplacementCm} cm`
                  : '—'}
              </Text>
            ))}
          </>
        ) : (
          <StatReadout label="Wobble" value={`${(num(payload, 'rmsG') ?? 0).toFixed(3)} g`} />
        )
      ) : null}

      {activityType === 'humanperf' ? (
        Array.isArray(payload.attempts) ? (
          <>
            {payload.summary && typeof payload.summary === 'object' ? (
              <StatReadout
                label="Hardest movement"
                value={String(
                  (payload.summary as Record<string, unknown>).hardestMovementLabel ?? '—',
                )}
              />
            ) : null}
            <Text style={styles.section}>Movements ({(payload.attempts as unknown[]).length})</Text>
            {(payload.attempts as Record<string, unknown>[]).map((a, i) => (
              <Text key={i} style={styles.line}>
                {String(a.movementLabel ?? a.movement)}: avg{' '}
                {typeof a.avgJerkMm === 'number' ? `${a.avgJerkMm.toFixed(1)} mm` : '—'} (
                {String(a.smoothnessRating ?? '—')})
              </Text>
            ))}
          </>
        ) : (
          <StatReadout label="Jerk RMS" value={`${(num(payload, 'jerkRms') ?? 0).toFixed(2)}`} />
        )
      ) : null}

      {activityType === 'breathing' ? (
        <StatReadout
          label="Breathing rate"
          value={`${Math.round(num(payload, 'bpm') ?? score)} bpm`}
        />
      ) : null}

      {activityType === 'handfan' && Array.isArray(payload.trials) ? (
        <>
          <Text style={styles.section}>Trials ({payload.trials.length})</Text>
          {(payload.trials as Record<string, unknown>[]).slice(0, 3).map((t, i) => (
            <Text key={i} style={styles.line}>
              Design {String(t.design)}, {String(t.distanceCm)} cm:{' '}
              {String(t.actualAngleDeg ?? '—')}°
            </Text>
          ))}
          {(payload.trials as unknown[]).length > 3 ? (
            <Text style={styles.line}>…and {(payload.trials as unknown[]).length - 3} more</Text>
          ) : null}
        </>
      ) : null}

      {activityType === 'parachute' && Array.isArray(payload.runs) ? (
        <>
          <Text style={styles.section}>Runs ({payload.runs.length})</Text>
          {(payload.runs as Record<string, unknown>[]).slice(0, 3).map((r, i) => (
            <Text key={i} style={styles.line}>
              {String(r.designName ?? r.tabKey ?? `Run ${i + 1}`)}:{' '}
              {num(r, 'finalVelocityMps') != null
                ? `${num(r, 'finalVelocityMps')!.toFixed(2)} m/s`
                : '—'}
            </Text>
          ))}
        </>
      ) : null}
    </>
  );
}
