import React, { type PropsWithChildren } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { AppHeader } from './AppHeader';
import { useAppTheme } from '../theme/useAppTheme';

type ScreenShellProps = PropsWithChildren<{
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  /** True under tab layout (battery strip handles top safe area). */
  compactHeader?: boolean;
}>;

export function ScreenShell({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  compactHeader = false,
}: ScreenShellProps) {
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
      <AppHeader compactTop={compactHeader} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void onRefresh()}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
