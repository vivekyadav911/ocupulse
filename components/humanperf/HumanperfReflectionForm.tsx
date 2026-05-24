import { Text, View } from 'react-native';
import type { HumanperfReflection } from '../../lib/humanperf/sessionState';
import { FormField } from '../FormField';
import { useThemedStyles } from '../../theme/themedStyles';

type HumanperfReflectionFormProps = {
  reflection: HumanperfReflection;
  onChange: (partial: Partial<HumanperfReflection>) => void;
};

export function HumanperfReflectionForm({ reflection, onChange }: HumanperfReflectionFormProps) {
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    multiline: {
      minHeight: 72,
      textAlignVertical: 'top' as const,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Reflection</Text>
      <FormField
        label="Which movement was hardest to keep smooth?"
        value={reflection.hardestToKeepSmooth}
        onChangeText={(v) => onChange({ hardestToKeepSmooth: v })}
        multiline
        style={styles.multiline}
        placeholder="Describe what felt roughest…"
      />
      <FormField
        label="Did vibration feedback help improve your score?"
        value={reflection.feedbackHelped}
        onChangeText={(v) => onChange({ feedbackHelped: v })}
        multiline
        style={styles.multiline}
        placeholder="Yes / no — and how?"
      />
      <FormField
        label="Any surprises?"
        value={reflection.surprises}
        onChangeText={(v) => onChange({ surprises: v })}
        multiline
        style={styles.multiline}
        placeholder="What surprised you about the results?"
      />
    </View>
  );
}
