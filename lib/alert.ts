import { Alert, Platform } from 'react-native';

/** Cross-platform alert — `Alert.alert` is unreliable on web. */
export function showAlert(title: string, message?: string): void {
  const body = message ? `${title}\n\n${message}` : title;
  if (Platform.OS === 'web') {
    globalThis.alert?.(body);
    return;
  }
  Alert.alert(title, message);
}
