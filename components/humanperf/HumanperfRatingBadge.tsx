import { Text, View } from 'react-native';
import type { SmoothnessRating } from '../../lib/calc/humanperfJerk';
import { ratingColor } from '../../lib/calc/humanperfJerk';
import { useThemedStyles } from '../../theme/themedStyles';

type HumanperfRatingBadgeProps = {
  rating: SmoothnessRating;
};

export function HumanperfRatingBadge({ rating }: HumanperfRatingBadgeProps) {
  const styles = useThemedStyles((t) => ({
    badge: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 4,
      borderRadius: t.radii.sm,
      backgroundColor: ratingColor(rating) + '22',
      borderWidth: 1,
      borderColor: ratingColor(rating),
    },
    text: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: ratingColor(rating),
    },
  }));

  return (
    <View style={styles.badge} accessibilityLabel={`Smoothness rating ${rating}`}>
      <Text style={styles.text}>{rating}</Text>
    </View>
  );
}
