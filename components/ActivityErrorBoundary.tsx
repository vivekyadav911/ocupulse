import React, { type PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { Button } from './Button';

type State = { error: Error | null };

export class ActivityErrorBoundary extends React.Component<
  PropsWithChildren<{ onReset?: () => void }>,
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.error('[ActivityErrorBoundary]', error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: '800', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ marginBottom: 16, lineHeight: 20 }}>{this.state.error.message}</Text>
          <Button
            title="Try again"
            onPress={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
          />
        </View>
      );
    }
    return this.props.children;
  }
}
