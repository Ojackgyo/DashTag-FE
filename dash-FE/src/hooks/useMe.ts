import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/user';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: isLoggedIn(),
    staleTime: 60 * 1000,
  });
}
