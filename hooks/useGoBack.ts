import { useRouter, useSegments } from 'expo-router';
import { useCallback } from 'react';

function isLoginScreen(segments: string[]): boolean {
  return segments[0] === '(auth)' && segments[1] === 'login';
}

function isHomeScreen(segments: string[]): boolean {
  if (segments[0] !== '(tabs)') return false;
  const tab = segments[1];
  return tab === undefined || tab === 'index';
}

/** True when the header/stack should show a back control. */
export function useShowBackButton(): boolean {
  const router = useRouter();
  const segments = useSegments();
  return router.canGoBack() && !isLoginScreen(segments) && !isHomeScreen(segments);
}

export function useGoBack() {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);
}
