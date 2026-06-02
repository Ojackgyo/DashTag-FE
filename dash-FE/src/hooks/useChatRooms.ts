import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '../api/chat';
import { isLoggedIn } from '../api/client';
import { queryKeys } from '../lib/queryKeys';

export function useChatRooms() {
  return useQuery({
    queryKey: queryKeys.chatRooms,
    queryFn: getChatRooms,
    enabled: isLoggedIn(),
    staleTime: 30 * 1000,
  });
}
