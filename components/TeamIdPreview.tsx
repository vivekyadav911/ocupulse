import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { lookupTeamIdByName } from '../services/teamManagement';
import { useThemedStyles } from '../theme/themedStyles';

type TeamIdPreviewProps = {
  teamName: string;
};

/** Shows stable team id for a typed team name (existing or will be created on save). */
export function TeamIdPreview({ teamName }: TeamIdPreviewProps) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const styles = useThemedStyles((t) => ({
    box: {
      marginTop: t.spacing.sm,
      marginBottom: t.spacing.md,
      padding: t.spacing.sm,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    label: {
      fontSize: t.typography.caption,
      fontWeight: '700',
      color: t.colors.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
      marginBottom: t.spacing.xs,
    },
    id: { fontFamily: 'monospace', color: t.colors.accent, fontSize: t.typography.caption },
    hint: { marginTop: t.spacing.xs, color: t.colors.muted, fontSize: t.typography.caption },
  }));

  useEffect(() => {
    const trimmed = teamName.trim();
    if (!trimmed) {
      setTeamId(null);
      return;
    }
    const timer = setTimeout(() => {
      void lookupTeamIdByName(trimmed).then(setTeamId);
    }, 400);
    return () => clearTimeout(timer);
  }, [teamName]);

  if (!teamName.trim()) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.label}>Team ID</Text>
      <Text style={styles.id}>{teamId ?? 'New ID on save…'}</Text>
      <Text style={styles.hint}>
        {teamId
          ? 'Ready to join — tap Continue to start experiments right away.'
          : 'Choose a team from the list above.'}
      </Text>
    </View>
  );
}
