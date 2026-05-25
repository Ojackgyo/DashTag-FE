import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChance, spendChance } from '../api/chance';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';

export function useChance() {
  const queryClient = useQueryClient();

  const { data, isLoading: chanceLoading } = useQuery({
    queryKey: queryKeys.chance,
    queryFn: getChance,
    enabled: isLoggedIn(),
    staleTime: 30 * 1000,
  });

  const { mutateAsync: spend, isPending: loading } = useMutation({
    mutationFn: spendChance,
    onSuccess: (res) => {
      queryClient.setQueryData(queryKeys.chance, res);
    },
  });

  return {
    hasChance: data?.has_chance ?? false,
    chanceLoading,
    spend,
    loading,
  };
}
