import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatStore } from '../context/ChatContext';
import { useListenMessages } from '../hooks/useListenMessages';
import Sidebar from '../components/sidebar/Sidebar';
import ChatContainer from '../components/chat/ChatContainer';

const Chat = () => {
  const { isAuthenticated, loading } = useAuth();
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(true);

  useListenMessages();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (selectedConversation && window.innerWidth < 768) {
      setShowSidebar(false);
    } else if (!selectedConversation && window.innerWidth < 768) {
      setShowSidebar(true);
    }
  }, [selectedConversation]);

  const handleBackToSidebar = () => {
    setShowSidebar(true);
    setSelectedConversation(null);
  };

  // Enhanced Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-900 rounded-full animate-spin"></div>
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium animate-pulse">
          Loading your conversations...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar - Desktop Always Visible, Mobile Conditional */}
      <div 
        className={`
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 
          fixed md:relative 
          inset-y-0 left-0 
          w-full md:w-80 lg:w-96 
          z-30 md:z-auto
          transition-transform duration-300 ease-in-out
          shadow-2xl md:shadow-none
        `}
      >
        <Sidebar />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={handleBackToSidebar}
        />
      )}
      
      {/* Chat Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {selectedConversation ? (
          <ChatContainer />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-lg animate-fade-in">
              {/* Animated Icon */}
              <div className="relative inline-block mb-8">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                {/* Floating Particles */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              </div>

              {/* Welcome Text */}
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Your Chats
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Select a conversation from the sidebar or search for someone new to start chatting
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="text-3xl mb-2">💬</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Real-time Chat</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instant messaging with friends</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: '0.1s' }}>
                  <div className="text-3xl mb-2">📞</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Voice & Video</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">HD calls with anyone</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: '0.2s' }}>
                  <div className="text-3xl mb-2">🎤</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Voice Messages</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Send quick voice notes</p>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-8 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Pro Tip: Use the search bar to find and start new conversations!</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
