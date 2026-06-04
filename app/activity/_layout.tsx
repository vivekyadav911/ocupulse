import { Stack } from 'expo-router';
import { ActivityErrorBoundary } from '../../components/ActivityErrorBoundary';

export default function ActivityLayout() {
  return (
    <ActivityErrorBoundary>
      <Stack screenOptions={{ headerShown: false }} />
    </ActivityErrorBoundary>
  );
}
