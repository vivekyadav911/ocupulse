import { Text, View } from 'react-native';
import { useThemedStyles } from '../theme/themedStyles';

export function PendingApprovalBanner() {
  const styles = useThemedStyles((t) => ({
    wrap: {
      backgroundColor: `${t.colors.accentMuted}`,
      borderRadius: t.radii.md,
      padding: t.spacing.md,
      marginBottom: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.accent,
    },
    title: { fontWeight: '800', color: t.colors.text, marginBottom: t.spacing.xs },
    body: { color: t.colors.muted, lineHeight: 20 },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Waiting for teacher approval</Text>
      <Text style={styles.body}>
        Your teacher must accept you on the team roster before you can run experiments or appear on
        the team leaderboard. You can still view this screen while you wait.
      </Text>
    </View>
  );
}
