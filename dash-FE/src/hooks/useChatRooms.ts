import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '../api/chat';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';

export function useChatRooms() {
  return useQuery({
    queryKey: queryKeys.chatRooms,
    queryFn: getChatRooms,
    enabled: isLoggedIn(),
    staleTime: 10 * 1000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}
