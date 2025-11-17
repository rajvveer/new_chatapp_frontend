import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useChatStore } from '../context/ChatContext';

export const useListenMessages = () => {
  const { socket } = useSocket();
  const { addMessage, selectedConversation, updateMessage, updateConversationLastMessage } = useChatStore();

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    // Join conversation room
    socket.emit('conversation:join', selectedConversation._id);
    console.log('✅ Joined conversation room:', selectedConversation._id);

    // Handle incoming messages
    const handleMessageReceived = (response) => {
      console.log('📥 Message received:', response);
      if (response.success && response.data) {
        const message = response.data;
        
        // Add to messages if in this conversation
        if (selectedConversation && message.conversation === selectedConversation._id) {
          addMessage(message);
        }

        // ⭐ Update conversation list in sidebar
        updateConversationLastMessage(message.conversation, message);
      }
    };

    // Handle reactions
    const handleReaction = ({ messageId, reactions }) => {
      console.log('👍 Reaction received:', { messageId, reactions });
      updateMessage(messageId, { reactions });
    };

    // Handle message deletion
    const handleMessageDeleted = ({ messageId }) => {
      console.log('🗑️ Message deleted:', messageId);
      updateMessage(messageId, { deleted: true });
    };

    // Listen to events
    socket.on('message:received', handleMessageReceived);
    socket.on('message:reaction', handleReaction);
    socket.on('message:deleted', handleMessageDeleted);

    // Cleanup
    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('message:reaction', handleReaction);
      socket.off('message:deleted', handleMessageDeleted);
      socket.emit('conversation:leave', selectedConversation._id);
      console.log('👋 Left conversation room:', selectedConversation._id);
    };
  }, [socket, addMessage, selectedConversation, updateMessage, updateConversationLastMessage]);
};
