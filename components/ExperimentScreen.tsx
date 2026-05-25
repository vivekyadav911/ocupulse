import React, { type PropsWithChildren } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppHeader } from './AppHeader';
import { PageTitle } from './PageTitle';
import { useAppTheme } from '../theme/useAppTheme';

export function ExperimentScreen({
  children,
  title = 'Experiment',
  eyebrow = 'Active session',
  scrollEnabled = true,
  contentContainerStyle,
}: PropsWithChildren<{
  title?: string;
  eyebrow?: string;
  scrollEnabled?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>) {
  const { colors, spacing } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
      <AppHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="never"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          nestedScrollEnabled
          scrollEnabled={scrollEnabled}
          contentContainerStyle={[
            {
              padding: spacing.md,
              paddingBottom: spacing.xl,
              flexGrow: 1,
            },
            contentContainerStyle,
          ]}
        >
          <PageTitle eyebrow={eyebrow} title={title} />
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
