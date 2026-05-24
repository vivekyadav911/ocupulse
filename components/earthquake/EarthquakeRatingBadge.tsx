import { Text, View } from 'react-native';
import {
  ratingColor,
  ratingLabel,
  type EarthquakeRating,
} from '../../lib/calc/earthquakeDisplacement';
import { useThemedStyles } from '../../theme/themedStyles';

type EarthquakeRatingBadgeProps = {
  rating: EarthquakeRating;
};

export function EarthquakeRatingBadge({ rating }: EarthquakeRatingBadgeProps) {
  const color = ratingColor(rating);
  const styles = useThemedStyles((t) => ({
    pill: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radii.xl,
      backgroundColor: color + '22',
      borderWidth: 1,
      borderColor: color,
    },
    text: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
  }));

  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{ratingLabel(rating)}</Text>
    </View>
  );
}
