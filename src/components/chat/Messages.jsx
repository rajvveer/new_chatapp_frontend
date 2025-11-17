import { useEffect, useRef } from 'react';
import { useChatStore } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Message from './Message';

const Messages = () => {
  const { messages, typingUsers, selectedConversation } = useChatStore();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const typingUsersInConversation = typingUsers[selectedConversation?._id] || [];
  const validMessages = messages.filter(msg => msg && msg._id && msg.sender);

  return (
    <div className="p-6 space-y-2">
      {validMessages.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </p>
        </div>
      ) : (
        validMessages.map((message) => (
          <Message 
            key={message._id} 
            message={message} 
            isOwn={message.sender?._id === user?._id} 
          />
        ))
      )}

      {typingUsersInConversation.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="message-bubble-received flex items-center gap-1 py-3">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default Messages;
