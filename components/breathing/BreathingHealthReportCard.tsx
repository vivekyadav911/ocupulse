import { Text, View } from 'react-native';
import {
  buildBreathingHealthReport,
  healthCategoryColor,
  type BreathingHealthReport,
} from '../../lib/breathing/healthBrackets';
import type { BreathingStateRecording } from '../../lib/breathing/sessionState';
import type { GradeLevel } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

type BreathingHealthReportCardProps = {
  gradeLevel: GradeLevel;
  recordings: Partial<Record<'rest' | 'jog' | 'starJumps', BreathingStateRecording>>;
  report?: BreathingHealthReport | null;
};

export function BreathingHealthReportCard({
  gradeLevel,
  recordings,
  report: reportProp,
}: BreathingHealthReportCardProps) {
  const report = reportProp ?? buildBreathingHealthReport(gradeLevel, recordings);

  const styles = useThemedStyles((t) => ({
    card: {
      padding: t.spacing.md,
      borderRadius: t.radii.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.readoutBg,
      marginBottom: t.spacing.md,
    },
    title: {
      fontSize: t.typography.body,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginBottom: t.spacing.xs,
    },
    meta: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
      lineHeight: 18,
    },
    rangeBox: {
      padding: t.spacing.sm,
      borderRadius: t.radii.md,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginBottom: t.spacing.md,
    },
    rangeLabel: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.muted,
      marginBottom: 4,
    },
    rangeValue: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    row: {
      paddingVertical: t.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    rowHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 4,
    },
    rowLabel: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
    },
    rowBpm: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: t.colors.text,
    },
    badge: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 2,
      borderRadius: 999,
      marginBottom: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800' as const,
      color: '#fff',
      textTransform: 'capitalize' as const,
    },
    detail: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
    },
    summary: {
      marginTop: t.spacing.sm,
      fontSize: t.typography.body,
      color: t.colors.text,
      lineHeight: 22,
    },
    disclaimer: {
      marginTop: t.spacing.sm,
      fontSize: 10,
      color: t.colors.muted,
      lineHeight: 16,
    },
  }));

  const { bracket } = report;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Health & age report</Text>
      <Text style={styles.meta}>
        Based on your profile ({gradeLevel}, {bracket.ageLabel}). These are educational reference
        ranges, not a medical diagnosis.
      </Text>

      <View style={styles.rangeBox}>
        <Text style={styles.rangeLabel}>Healthy resting BPM for your age</Text>
        <Text style={styles.rangeValue}>
          {bracket.healthyRestMin}–{bracket.healthyRestMax} breaths/min
        </Text>
      </View>

      {report.rows.map((row) => (
        <View key={row.stateId} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowLabel}>{row.stateLabel}</Text>
            <Text style={styles.rowBpm}>{row.bpm.toFixed(1)} BPM</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: healthCategoryColor(row.category) }]}>
            <Text style={styles.badgeText}>{row.category}</Text>
          </View>
          <Text style={styles.detail}>{row.detail}</Text>
        </View>
      ))}

      <Text style={styles.summary}>{report.overallSummary}</Text>
      <Text style={styles.disclaimer}>
        Reference: pediatric resting respiratory rates. Consult a health professional for clinical
        concerns.
      </Text>
    </View>
  );
}
