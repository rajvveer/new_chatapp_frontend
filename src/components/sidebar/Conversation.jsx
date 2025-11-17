import { useChatStore } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatMessageTime } from '../../utils/helpers';

const Conversation = ({ conversation }) => {
  const { user } = useAuth();
  const { selectedConversation, setSelectedConversation, fetchMessages } = useChatStore();
  const { socket, onlineUsers } = useSocket();

  const otherParticipant = conversation.participants.find(
    (p) => p._id !== user._id
  );

  const isOnline = onlineUsers.includes(otherParticipant?._id);
  const isSelected = selectedConversation?._id === conversation._id;

  const handleClick = async () => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation._id);
    
    if (socket) {
      socket.emit('conversation:join', conversation._id);
    }
  };

  const getMessagePreview = () => {
    if (!conversation.lastMessage) {
      return 'Start a conversation';
    }

    const msg = conversation.lastMessage;
    const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
    const prefix = isOwn ? 'You: ' : '';

    switch (msg.messageType) {
      case 'image':
        return `${prefix}📷 Photo`;
      case 'gif':
        return `${prefix}🎬 GIF`;
      case 'audio':
        return `${prefix}🎤 Voice message`;
      case 'video':
        return `${prefix}🎥 Video`;
      case 'file':
        return `${prefix}📎 File`;
      default:
        return `${prefix}${msg.content?.substring(0, 35) || 'Message'}${msg.content?.length > 35 ? '...' : ''}`;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full p-4 flex items-center gap-3 transition-all hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-800 ${
        isSelected ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-l-blue-500' : ''
      }`}
    >
      {/* Avatar with Online Status */}
      <div className="relative flex-shrink-0">
        <img
          src={otherParticipant?.avatar}
          alt={otherParticipant?.username}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-200 dark:ring-slate-700"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate text-base">
            {conversation.isGroupChat
              ? conversation.groupName
              : otherParticipant?.username}
          </h4>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 font-medium">
              {formatMessageTime(conversation.updatedAt)}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {getMessagePreview()}
        </p>
        {isOnline && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Active now
          </span>
        )}
      </div>
    </button>
  );
};

export default Conversation;
