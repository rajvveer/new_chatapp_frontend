import { useState, useRef } from 'react';
import { useChatStore } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import EmojiPicker from 'emoji-picker-react';
import { FaPaperPlane, FaSmile, FaImage, FaTimes, FaMicrophone, FaStop } from 'react-icons/fa';
import { MdGif } from 'react-icons/md';
import GifPicker from './GifPicker';
import VoiceRecorder from './VoiceRecorder';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const { selectedConversation, replyingTo, clearReply } = useChatStore();
  const { socket } = useSocket();
  const fileInputRef = useRef();
  const inputRef = useRef();
  const typingTimeoutRef = useRef();

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!socket || !selectedConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', {
        conversationId: selectedConversation._id,
        username: socket.user?.username,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId: selectedConversation._id,
      });
      setIsTyping(false);
    }, 2000);
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleGifSelect = (gifUrl) => {
    if (!socket || !selectedConversation) return;

    const messageData = {
      conversationId: selectedConversation._id,
      content: gifUrl,
      messageType: 'gif',
      replyTo: replyingTo?._id || null,
    };

    console.log('📤 Sending GIF with data:', messageData);
    socket.emit('message:send', messageData);
    
    setShowGifPicker(false);
    clearReply();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('media', file);
    formData.append('conversationId', selectedConversation._id);
    formData.append('messageType', 'image');
    
    if (replyingTo) {
      formData.append('replyTo', replyingTo._id);
    }

    try {
      const response = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('✅ Image uploaded:', response.data);
      toast.success('Image sent!');
      clearReply();
    } catch (error) {
      console.error('❌ Image upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to send image');
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceSend = async (audioBlob, duration) => {
    setUploading(true);
    setShowVoiceRecorder(false);

    const formData = new FormData();
    formData.append('media', audioBlob, 'voice-message.webm');
    formData.append('conversationId', selectedConversation._id);
    formData.append('messageType', 'audio');
    formData.append('duration', duration);
    
    if (replyingTo) {
      formData.append('replyTo', replyingTo._id);
    }

    try {
      const response = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('✅ Voice message sent:', response.data);
      toast.success('Voice message sent!');
      clearReply();
    } catch (error) {
      console.error('❌ Voice message error:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !selectedConversation) return;

    const messageData = {
      conversationId: selectedConversation._id,
      content: message.trim(),
      messageType: 'text',
      replyTo: replyingTo?._id || null,
    };

    try {
      console.log('📤 Sending message:', messageData);
      socket.emit('message:send', messageData);
      
      setMessage('');
      setShowEmojiPicker(false);
      clearReply();
      
      if (socket) {
        socket.emit('typing:stop', {
          conversationId: selectedConversation._id,
        });
      }
      setIsTyping(false);
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send error:', error);
    }
  };

  return (
    <>
      <div className="flex-shrink-0 px-4 md:px-6 py-3 md:py-4 border-t border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
        
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500"></div>
            <div className="p-3 pl-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    Replying to {replyingTo.sender?.username}
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {replyingTo.messageType === 'image' || replyingTo.messageType === 'gif'
                    ? '📷 Photo'
                    : replyingTo.messageType === 'audio'
                    ? '🎤 Voice message'
                    : replyingTo.content?.substring(0, 60) || 'Message'}
                </p>
              </div>
              <button
                onClick={clearReply}
                className="flex-shrink-0 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-all hover:scale-110 active:scale-95"
              >
                <FaTimes className="text-gray-600 dark:text-gray-400" size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 md:left-6 z-50 animate-in fade-in zoom-in duration-200">
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full z-20 shadow-lg transition-all hover:scale-110 active:scale-95"
              >
                <FaTimes size={12} />
              </button>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                height={400}
                width={350}
              />
            </div>
          </div>
        )}

        {/* GIF Picker */}
        {showGifPicker && (
          <GifPicker
            onGifSelect={handleGifSelect}
            onClose={() => setShowGifPicker(false)}
          />
        )}

        {/* Message Input Form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Attachment Buttons Container */}
          <div className="flex items-center gap-1 mb-1">
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                showEmojiPicker
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                  : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Add emoji"
            >
              <FaSmile size={20} />
            </button>

            {/* GIF Button */}
            <button
              type="button"
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
              }}
              className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                showGifPicker
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Send GIF"
            >
              <MdGif size={24} />
            </button>

            {/* Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                uploading
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Upload image"
            >
              {uploading ? (
                <div className="animate-spin">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              ) : (
                <FaImage size={18} />
              )}
            </button>

            {/* Voice Message Button */}
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              disabled={uploading}
              className="p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Record voice message"
            >
              <FaMicrophone size={18} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Text Input with Enhanced Styling */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder={replyingTo ? `Reply to ${replyingTo.sender?.username}...` : "Type a message..."}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-600 transition-all outline-none text-[15px]"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim()}
            className={`flex-shrink-0 p-3.5 rounded-2xl transition-all transform shadow-lg mb-1 ${
              message.trim()
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-110 active:scale-95 hover:shadow-xl'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
            }`}
            title="Send message"
          >
            <FaPaperPlane size={18} className={message.trim() ? 'transform translate-x-0.5' : ''} />
          </button>
        </form>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}
    </>
  );
};

export default MessageInput;
