import { useSyncExternalStore } from 'react';
import { getToken } from '../api/client';

function subscribe(listener: () => void) {
  window.addEventListener('dashtag-auth', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('dashtag-auth', listener);
    window.removeEventListener('storage', listener);
  };
}
export function useSession() {
  return useSyncExternalStore(subscribe, getToken, () => null);
}
