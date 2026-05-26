import { useQuery } from '@tanstack/react-query';
import { getDatingRequests } from '../api/home';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';

export function useDatingRequests() {
  return useQuery({
    queryKey: queryKeys.datingRequests,
    queryFn: getDatingRequests,
    enabled: isLoggedIn(),
    staleTime: 30 * 1000,
  });
}