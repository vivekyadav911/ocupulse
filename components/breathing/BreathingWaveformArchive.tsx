import { ScrollView, Text, View } from 'react-native';
import type { BreathingTeamMemberRow } from '../../lib/breathing/sessionState';
import { useThemedStyles } from '../../theme/themedStyles';
import { BreathingWaveformChart } from './BreathingWaveformChart';

type BreathingWaveformArchiveProps = {
  rows: BreathingTeamMemberRow[];
};

export function BreathingWaveformArchive({ rows }: BreathingWaveformArchiveProps) {
  const withWaveform = rows.filter((r) => r.restWaveform.length >= 2);

  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    empty: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
    },
    scroll: { marginBottom: t.spacing.md },
    item: {
      marginRight: t.spacing.md,
      alignItems: 'center' as const,
    },
    member: {
      fontSize: t.typography.caption,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginBottom: t.spacing.xs,
    },
  }));

  if (withWaveform.length === 0) {
    return (
      <View>
        <Text style={styles.title}>At-rest waveform archive</Text>
        <Text style={styles.empty}>Resting waveforms appear here once team members upload.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>At-rest waveform archive</Text>
      <ScrollView horizontal style={styles.scroll} showsHorizontalScrollIndicator>
        {withWaveform.map((row) => (
          <View key={row.memberName} style={styles.item}>
            <Text style={styles.member}>{row.memberName}</Text>
            <BreathingWaveformChart samples={row.restWaveform} title="" height={72} compact />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
