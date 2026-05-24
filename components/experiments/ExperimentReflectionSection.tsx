import { Text, View } from 'react-native';
import { useThemedStyles } from '../../theme/themedStyles';

const REFLECTION_LABELS: Record<string, string> = {
  predictedReactionMs: 'Predicted reaction time (ms)',
  wereYouRight: 'Were you right?',
  surprises: 'Any surprises?',
  predictedBpm: 'Predicted BPM',
  practiceHelped: 'Did practice help?',
  hardestToKeepSmooth: 'Hardest to keep smooth',
  feedbackHelped: 'Did feedback help?',
  bestDesign: 'Best design',
  easiestDesign: 'Easiest design',
  predictionsCorrect: 'Predictions correct',
  earMuffRecommendation: 'Ear muff recommendation',
  bestDesignWhy: 'Why best design worked',
};

function reflectionLabel(key: string): string {
  return (
    REFLECTION_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  );
}

type ExperimentReflectionSectionProps = {
  reflection: unknown;
};

export function ExperimentReflectionSection({ reflection }: ExperimentReflectionSectionProps) {
  const styles = useThemedStyles((t) => ({
    section: {
      color: t.colors.muted,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.8,
      fontSize: t.typography.caption,
    },
    line: { color: t.colors.text, marginBottom: t.spacing.sm, lineHeight: 22 },
    label: { fontWeight: '700' as const, color: t.colors.text },
    value: { color: t.colors.muted },
  }));

  if (!reflection || typeof reflection !== 'object' || Array.isArray(reflection)) return null;

  const entries = Object.entries(reflection as Record<string, unknown>).filter(
    ([, value]) => value != null && String(value).trim() !== '',
  );
  if (!entries.length) return null;

  return (
    <View>
      <Text style={styles.section}>Reflection</Text>
      {entries.map(([key, value]) => (
        <Text key={key} style={styles.line}>
          <Text style={styles.label}>{reflectionLabel(key)}: </Text>
          <Text style={styles.value}>{String(value)}</Text>
        </Text>
      ))}
    </View>
  );
}
