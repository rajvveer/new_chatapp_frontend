import { useEffect } from 'react';
import { useChatStore } from '../context/ChatContext';

export const useGetConversations = () => {
  const { fetchConversations, loading } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  return { loading };
};
