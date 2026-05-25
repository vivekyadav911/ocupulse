import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSessionAutoLogout } from '../hooks/useSessionAutoLogout';

/** Captures touches and scrolls anywhere in the tree to reset the inactivity timer. */
export function SessionActivityGuard({ children }: PropsWithChildren) {
  const { onUserActivity } = useSessionAutoLogout();

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        onUserActivity();
        return false;
      }}
      onMoveShouldSetResponderCapture={() => {
        onUserActivity();
        return false;
      }}
    >
      {children}
    </View>
  );
}
