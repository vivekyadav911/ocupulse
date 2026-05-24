import type { Router } from 'expo-router';
import { signOutUser } from '../services/auth';

/** Signs out and returns to the login screen (e.g. after quick join). */
export async function returnToLogin(router: Router) {
  await signOutUser();
  router.replace('/(auth)/login');
}
