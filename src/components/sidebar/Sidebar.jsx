import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGetConversations } from '../../hooks/useGetConversations';
import SearchInput from './SearchInput';
import Conversations from './Conversations';
import { FaSignOutAlt, FaMoon, FaSun, FaUser, FaCog } from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { loading } = useGetConversations();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full">
      {/* Enhanced Header with Gradient */}
      <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-800 p-6 shadow-xl">
        {/* User Profile Section */}
        <div className="flex items-center justify-between mb-5">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform duration-200 group"
            onClick={() => navigate('/profile')}
          >
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.username}
                className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg ring-4 ring-white/30 group-hover:ring-white/50 transition-all"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white drop-shadow-md">
                {user?.username}
              </h3>
              <div className="flex items-center gap-1.5 text-white/90 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="font-medium">Active now</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/profile')}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
              title="Profile Settings"
            >
              <FaUser size={16} />
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
              title="Logout"
            >
              <FaSignOutAlt size={16} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <SearchInput />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-slate-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
              Loading conversations...
            </p>
          </div>
        ) : (
          <Conversations />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
