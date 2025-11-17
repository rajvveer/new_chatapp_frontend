import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Messages from './Messages';
import MessageInput from './MessageInput';
import CallModal from '../call/CallModal';
import { FaVideo, FaPhone, FaArrowLeft, FaInfoCircle, FaEllipsisV } from 'react-icons/fa';

const ChatContainer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedConversation, markAsRead, clearReply } = useChatStore();
  const { socket, onlineUsers } = useSocket();
  const [callModalData, setCallModalData] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const otherParticipant = selectedConversation?.participants?.find(
    (p) => p._id !== user._id
  );

  const isOnline = onlineUsers.includes(otherParticipant?._id);

  // Clear reply when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      markAsRead(selectedConversation._id);
      clearReply();
    }
  }, [selectedConversation, markAsRead, clearReply]);

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 Incoming call received:', data);
      
      if (data.from !== user._id && data.conversationId === selectedConversation?._id) {
        setCallModalData({
          isOpen: true,
          callType: data.callType,
          otherUser: data.callerInfo,
          isIncoming: true,
        });
      }
    };

    const handleCallAccepted = (data) => {
      console.log('✅ Call accepted:', data);
      if (callModalData && !callModalData.isIncoming) {
        setCallModalData(prev => ({ ...prev, callStatus: 'connected' }));
      }
    };

    const handleCallRejected = (data) => {
      console.log('❌ Call rejected:', data);
      setCallModalData(null);
    };

    const handleCallEnded = (data) => {
      console.log('📵 Call ended:', data);
      setCallModalData(null);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [socket, user, selectedConversation, callModalData]);

  const handleViewProfile = () => {
    if (otherParticipant?._id) {
      navigate(`/user/${otherParticipant._id}`);
    }
  };

  const handleVideoCall = () => {
    setCallModalData({
      isOpen: true,
      callType: 'video',
      otherUser: otherParticipant,
      isIncoming: false,
    });
    
    if (socket && selectedConversation) {
      socket.emit('call:initiate', {
        conversationId: selectedConversation._id,
        callType: 'video',
        receiverId: otherParticipant._id,
        callerInfo: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
        },
      });
      console.log('📞 Call initiated: video');
    }
  };

  const handleVoiceCall = () => {
    setCallModalData({
      isOpen: true,
      callType: 'voice',
      otherUser: otherParticipant,
      isIncoming: false,
    });
    
    if (socket && selectedConversation) {
      socket.emit('call:initiate', {
        conversationId: selectedConversation._id,
        callType: 'voice',
        receiverId: otherParticipant._id,
        callerInfo: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
        },
      });
      console.log('📞 Call initiated: voice');
    }
  };

  const handleCallClose = () => {
    if (socket && selectedConversation) {
      socket.emit('call:end', {
        conversationId: selectedConversation._id,
      });
    }
    setCallModalData(null);
  };

  if (!selectedConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-lg text-center relative z-10">
          {/* Animated Icon */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl shadow-2xl animate-float"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>

          {/* Welcome Text */}
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            Welcome to Pulse Chat
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
            Start a conversation, share moments, and connect with friends in real-time
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Real-time</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Instant messaging</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <FaVideo className="text-white" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Video Calls</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Face-to-face chats</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Secure</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">End-to-end encryption</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Select a conversation to get started
          </p>
        </div>

        {/* Add CSS for animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(3deg); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-slate-900">
        {/* Enhanced Chat Header */}
        <div className="flex-shrink-0 px-4 md:px-6 py-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-700/50 shadow-sm relative z-10">
          <div className="flex items-center justify-between">
            {/* User Info - Left Side */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              {/* Back Button (Mobile) */}
              <button
                onClick={() => navigate('/chat')}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-95"
              >
                <FaArrowLeft className="text-gray-600 dark:text-gray-400" size={18} />
              </button>

              {/* Avatar & Info */}
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-2xl p-2 -ml-2 transition-all duration-200 group min-w-0"
                onClick={handleViewProfile}
              >
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <img
                    src={otherParticipant?.avatar}
                    alt={otherParticipant?.username}
                    className="relative w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-md group-hover:ring-blue-400 dark:group-hover:ring-blue-500 transition-all"
                  />
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full">
                      <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                    {selectedConversation?.isGroupChat
                      ? selectedConversation.groupName
                      : otherParticipant?.username}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {isOnline ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Active now
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Right Side */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <button 
                onClick={handleVideoCall}
                className="p-2.5 md:p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
                title="Video Call"
              >
                <FaVideo size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
              <button 
                onClick={handleVoiceCall}
                className="p-2.5 md:p-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
                title="Voice Call"
              >
                <FaPhone size={14} className="md:w-4 md:h-4" />
              </button>
              <button 
                onClick={handleViewProfile}
                className="hidden md:flex p-3 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95"
                title="View Profile"
              >
                <FaInfoCircle size={18} />
              </button>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="md:hidden p-2.5 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 transition-all duration-200 active:scale-95"
                title="More"
              >
                <FaEllipsisV size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Container with WhatsApp-like Background */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 relative">
          {/* Modern Pattern Background */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] pointer-events-none">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="chat-dots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="1.5" fill="currentColor" className="text-gray-600 dark:text-gray-400" />
                  <circle cx="10" cy="10" r="1" fill="currentColor" className="text-gray-600 dark:text-gray-400" />
                  <circle cx="50" cy="50" r="1" fill="currentColor" className="text-gray-600 dark:text-gray-400" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#chat-dots)" />
            </svg>
          </div>
          
          <Messages />
        </div>

        {/* Message Input */}
        <MessageInput />
      </div>

      {/* Call Modal */}
      {callModalData && (
        <CallModal
          isOpen={callModalData.isOpen}
          onClose={handleCallClose}
          callType={callModalData.callType}
          otherUser={callModalData.otherUser}
          isIncoming={callModalData.isIncoming}
          socket={socket}
          conversationId={selectedConversation?._id}
        />
      )}
    </>
  );
};

export default ChatContainer;
