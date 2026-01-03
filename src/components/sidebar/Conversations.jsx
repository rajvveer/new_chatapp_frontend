import { useEffect } from 'react';
import { useChatStore } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import Conversation from './Conversation';

const Conversations = () => {
  const { conversations, fetchConversations } = useChatStore();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on('message:received', fetchConversations);
    return () => socket.off('message:received', fetchConversations);
  }, [socket, fetchConversations]);

  if (!conversations.length) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">No conversations yet</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
        Messages ({conversations.length})
      </div>
      {conversations.map((conversation) => (
        <Conversation key={conversation._id} conversation={conversation} />
      ))}
    </div>
  );
};

export default Conversations;