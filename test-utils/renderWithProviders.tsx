import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useThemeStore } from '../store/themeStore';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  useThemeStore.setState({ mode: 'light' });
  return render(<ThemeProvider>{ui}</ThemeProvider>, options);
}
