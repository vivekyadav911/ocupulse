import React, { type PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { AppHeader } from './AppHeader';
import { useAppTheme } from '../theme/useAppTheme';

type ScreenShellProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function ScreenShell({ children, scroll = true }: ScreenShellProps) {
  const { colors, spacing } = useAppTheme();

  const content = (
    <View
      style={[
        { padding: spacing.md, paddingBottom: scroll ? spacing.xl : spacing.md },
        !scroll && { flex: 1 },
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
      <AppHeader />
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
