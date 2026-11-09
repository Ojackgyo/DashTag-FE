import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChance } from '../api/chance';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';

export function useChance() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.chance, queryFn: getChance, enabled: isLoggedIn(),
    staleTime: 10000, refetchInterval: 30000, refetchOnWindowFocus: true });
  return {
    hasChance: query.data?.hasChance ?? false,
    remainingCount: query.data?.remainingCount,
    maxCount: query.data?.maxCount,
    rechargeAt: query.data?.rechargeAt ?? [],
    chanceLoading: query.isLoading,
    error: query.error,
    // Successful dating and meeting mutations spend chances on the server.
    spend: () => queryClient.invalidateQueries({ queryKey: queryKeys.chance }),
    loading: query.isFetching,
  };
}
