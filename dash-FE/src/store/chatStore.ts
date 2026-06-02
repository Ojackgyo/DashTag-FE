import { create } from 'zustand';
import type { ChatRoomResponse } from '../api/chat';

type Category = '소개팅' | '미팅' | '소모임';

interface ChatState {
  activeRoom: ChatRoomResponse | null;
  category: Category;
  setActiveRoom: (room: ChatRoomResponse | null) => void;
  setCategory: (category: Category) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeRoom: null,
  category: '소개팅',
  setActiveRoom: (room) => set({ activeRoom: room }),
  setCategory: (category) => set({ category }),
}));
