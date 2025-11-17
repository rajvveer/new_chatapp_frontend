import { useEffect } from 'react';
import { useChatStore } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import Conversation from './Conversation';

const Conversations = () => {
  const { conversations, fetchConversations } = useChatStore();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = () => {
      fetchConversations();
    };

    socket.on('message:received', handleMessageReceived);

    return () => {
      socket.off('message:received', handleMessageReceived);
    };
  }, [socket, fetchConversations]);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Search for users above to start your first conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Messages ({conversations.length})
        </h3>
      </div>
      <div>
        {conversations.map((conversation) => (
          <Conversation key={conversation._id} conversation={conversation} />
        ))}
      </div>
    </div>
  );
};

export default Conversations;
