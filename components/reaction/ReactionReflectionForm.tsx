import { Text, View } from 'react-native';
import type { ReactionReflection } from '../../lib/reaction/sessionState';
import { FormField } from '../FormField';
import { useThemedStyles } from '../../theme/themedStyles';

type ReactionReflectionFormProps = {
  reflection: ReactionReflection;
  onChange: (partial: Partial<ReactionReflection>) => void;
  showPrediction?: boolean;
  predictionReadOnly?: boolean;
};

export function ReactionReflectionForm({
  reflection,
  onChange,
  showPrediction = true,
  predictionReadOnly = false,
}: ReactionReflectionFormProps) {
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
    readOnly: {
      color: t.colors.muted,
      fontSize: t.typography.body,
      marginBottom: t.spacing.md,
    },
  }));

  return (
    <View>
      <Text style={styles.title}>Reflection</Text>
      {showPrediction ? (
        predictionReadOnly ? (
          <>
            <FormField
              label="Predict your reaction time before Phase 1 (ms)"
              value={reflection.predictedReactionMs}
              editable={false}
            />
          </>
        ) : (
          <FormField
            label="Predict your reaction time before Phase 1 (ms)"
            value={reflection.predictedReactionMs}
            onChangeText={(v) => onChange({ predictedReactionMs: v })}
            keyboardType="number-pad"
            placeholder="e.g. 250"
          />
        )
      ) : null}
      <FormField
        label="Any surprises?"
        value={reflection.surprises}
        onChangeText={(v) => onChange({ surprises: v })}
        multiline
        style={styles.multiline}
        placeholder="What surprised you about the results?"
      />
      <FormField
        label="Did practice help?"
        value={reflection.practiceHelped}
        onChangeText={(v) => onChange({ practiceHelped: v })}
        multiline
        style={styles.multiline}
        placeholder="Did repeating the challenge change your performance?"
      />
    </View>
  );
}
