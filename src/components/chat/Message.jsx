import { useState, useRef } from 'react';
import { formatMessageTime } from '../../utils/helpers';
import { FaCheck, FaCheckDouble, FaSmile, FaReply, FaPlay, FaPause } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import { useChatStore } from '../../context/ChatContext';

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

const Message = ({ message, isOwn }) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null); // ADD THIS REF
  const { socket } = useSocket();
  const { selectedConversation, setReplyingTo, messages } = useChatStore();

  if (!message || !message.sender) {
    return null;
  }

  const isRead = message.readBy && message.readBy.length > 1;
  const isGif = message.messageType === 'gif';
  const isImage = message.messageType === 'image' && message.mediaUrl;
  const isAudio = message.messageType === 'audio' && message.mediaUrl;
  const isText = !isGif && !isImage && !isAudio;

  const repliedMessage = message.replyTo
    ? (typeof message.replyTo === 'object' ? message.replyTo : messages.find(m => m._id === message.replyTo))
    : null;

  const handleReaction = (emoji) => {
    if (socket && selectedConversation) {
      socket.emit('message:react', {
        messageId: message._id,
        emoji,
        conversationId: selectedConversation._id,
      });
    }
    setShowReactionPicker(false);
  };

  const handleReply = () => {
    console.log('🔵 Setting reply to message:', message._id);
    setReplyingTo(message);
  };

  // ADD THIS FUNCTION
  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {}) || {};

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group px-2`}>
      <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} relative items-end`} style={{ maxWidth: '75%' }}>
        
        {/* Avatar */}
        {!isOwn && message.sender.avatar && (
          <div className="flex-shrink-0 mb-1">
            <img
              src={message.sender.avatar}
              alt={message.sender.username || 'User'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-md"
            />
          </div>
        )}

        <div className="flex flex-col relative">
          
          {/* Sender Name */}
          {!isOwn && message.sender.username && (
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 px-3">
              {message.sender.username}
            </p>
          )}

          <div className="relative">
            
            {/* Replied Message Preview */}
            {repliedMessage && (
              <div className={`mb-2 mx-1 ${isOwn ? 'mr-3' : 'ml-3'}`}>
                <div className={`relative pl-3 pr-4 py-2 rounded-xl ${
                  isOwn 
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-400' 
                    : 'bg-gray-100 dark:bg-slate-700/50 border-l-4 border-gray-400 dark:border-gray-500'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FaReply className="text-xs text-gray-500 dark:text-gray-400" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {repliedMessage.sender?.username || 'Unknown'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {repliedMessage.messageType === 'image' || repliedMessage.messageType === 'gif'
                      ? '📷 Photo'
                      : repliedMessage.messageType === 'audio'
                      ? '🎤 Voice message'
                      : repliedMessage.content?.substring(0, 50) || 'Message'}
                  </p>
                </div>
              </div>
            )}

            {/* GIF Display */}
            {isGif && message.content && (
              <div className="flex flex-col">
                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src={message.content}
                    alt="GIF"
                    className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                    style={{ maxWidth: '380px', minWidth: '240px', maxHeight: '380px' }}
                    onClick={() => window.open(message.content, '_blank')}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className="text-xs text-white font-medium">GIF</span>
                  </div>
                </div>
                <div className={`mt-1.5 px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 justify-end">
                    {message.createdAt ? formatMessageTime(message.createdAt) : ''}
                    {isOwn && (
                      <span className={isRead ? 'text-blue-500' : 'text-gray-400'}>
                        {isRead ? <FaCheckDouble size={13} /> : <FaCheck size={13} />}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Image Display */}
            {isImage && (
              <div className="flex flex-col">
                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src={message.mediaUrl}
                    alt="Message attachment"
                    className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                    style={{ maxWidth: '380px', minWidth: '240px' }}
                    onClick={() => window.open(message.mediaUrl, '_blank')}
                  />
                </div>
                <div className={`mt-1.5 px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 justify-end">
                    {message.createdAt ? formatMessageTime(message.createdAt) : ''}
                    {isOwn && (
                      <span className={isRead ? 'text-blue-500' : 'text-gray-400'}>
                        {isRead ? <FaCheckDouble size={13} /> : <FaCheck size={13} />}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Audio/Voice Message Display - FIXED */}
            {isAudio && (
              <div className="flex flex-col">
                <div className={`${
                  isOwn 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 shadow-gray-500/20'
                } rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all`} 
                style={{ minWidth: '280px', maxWidth: '340px' }}>
                  
                  {/* Waveform Visual */}
                  <div className="flex items-center gap-3">
                    <button 
                      className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                        isOwn 
                          ? 'bg-white/20 hover:bg-white/30 backdrop-blur-sm' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      onClick={toggleAudioPlayback}
                    >
                      {isPlayingAudio ? (
                        <FaPause className={`text-sm ${isOwn ? 'text-white' : 'text-white'}`} />
                      ) : (
                        <FaPlay className={`text-sm ml-0.5 ${isOwn ? 'text-white' : 'text-white'}`} />
                      )}
                    </button>
                    
                    {/* Waveform Bars */}
                    <div className="flex-1 flex items-center gap-1 h-10">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all ${
                            isOwn 
                              ? 'bg-white/40' 
                              : 'bg-gray-400 dark:bg-gray-500'
                          }`}
                          style={{
                            height: `${20 + Math.random() * 60}%`,
                            opacity: i / 20 <= audioProgress ? 1 : 0.4
                          }}
                        />
                      ))}
                    </div>
                    
                    <span className={`text-xs font-medium flex-shrink-0 ${
                      isOwn ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                    </span>
                  </div>

                  {/* Audio Element - FIXED with ref */}
                  <audio
                    ref={audioRef}
                    src={message.mediaUrl}
                    onTimeUpdate={(e) => {
                      const progress = e.target.currentTime / e.target.duration;
                      setAudioProgress(progress);
                    }}
                    onEnded={() => {
                      setIsPlayingAudio(false);
                      setAudioProgress(0);
                    }}
                    onPlay={() => setIsPlayingAudio(true)}
                    onPause={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                </div>
                
                <div className={`mt-1.5 px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 justify-end">
                    {message.createdAt ? formatMessageTime(message.createdAt) : ''}
                    {isOwn && (
                      <span className={isRead ? 'text-blue-500' : 'text-gray-400'}>
                        {isRead ? <FaCheckDouble size={13} /> : <FaCheck size={13} />}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Text Message */}
            {isText && (
              <div className={`relative ${
                isOwn 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30' 
                  : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 shadow-gray-500/20'
              } rounded-2xl px-4 py-2.5 shadow-md hover:shadow-lg transition-all`}>
                <p className="text-[15px] leading-relaxed" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {message.content || ''}
                </p>
                <div className={`flex items-center justify-end gap-1.5 mt-1 ${isOwn ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  <span className="text-xs">
                    {message.createdAt ? formatMessageTime(message.createdAt) : ''}
                  </span>
                  {isOwn && (
                    <span className={isRead ? 'text-white' : 'text-white/60'}>
                      {isRead ? <FaCheckDouble size={13} /> : <FaCheck size={13} />}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`absolute ${isOwn ? 'left-0 -ml-20' : 'right-0 -mr-20'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-1.5`}>
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="p-2.5 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full shadow-lg transform hover:scale-110 transition-all"
                title="React"
              >
                <FaSmile className="text-gray-600 dark:text-gray-300" size={15} />
              </button>
              <button
                onClick={handleReply}
                className="p-2.5 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full shadow-lg transform hover:scale-110 transition-all"
                title="Reply"
              >
                <FaReply className="text-gray-600 dark:text-gray-300" size={15} />
              </button>
            </div>

            {/* Reaction Picker */}
            {showReactionPicker && (
              <div className={`absolute ${isOwn ? 'left-0 -translate-x-2' : 'right-0 translate-x-2'} -top-16 bg-white dark:bg-slate-800 rounded-full shadow-2xl p-2.5 flex gap-1 z-20 border border-gray-200 dark:border-slate-600`}>
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="hover:scale-125 transition-transform text-xl p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Display Reactions */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className={`flex flex-wrap gap-1.5 mt-2 ${isOwn ? 'justify-end' : 'justify-start'} px-1`}>
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-sm hover:scale-110 hover:shadow-md transition-all shadow-sm"
                  title={reactions.map(r => r.user?.username || 'Someone').join(', ')}
                >
                  <span className="text-base">{emoji}</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{reactions.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
