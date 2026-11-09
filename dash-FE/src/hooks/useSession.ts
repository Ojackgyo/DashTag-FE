import { useSyncExternalStore } from 'react';
import { getToken } from '../api/client';

function subscribe(listener: () => void) {
  window.addEventListener('dashtag-auth', listener);
  window.addEventListener('storage', listener);
  window.addEventListener('dashtag-token-refreshed', listener);
  return () => {
    window.removeEventListener('dashtag-auth', listener);
    window.removeEventListener('storage', listener);
    window.removeEventListener('dashtag-token-refreshed', listener);
  };
}
export function useSession() {
  return useSyncExternalStore(subscribe, getToken, () => null);
}
