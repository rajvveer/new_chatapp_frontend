import { useState } from 'react';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import api from '../../utils/api';
import { useChatStore } from '../../context/ChatContext';
import { toast } from 'react-toastify';

const SearchInput = () => {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const { createConversation, setSelectedConversation } = useChatStore();

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${query}`);
      setSearchResults(data.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = async (user) => {
    try {
      const conversation = await createConversation(user._id);
      setSelectedConversation(conversation);
      setSearch('');
      setSearchResults([]);
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
        {searching && (
          <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 max-h-64 overflow-y-auto z-10">
          {searchResults.map((user) => (
            <button
              key={user._id}
              onClick={() => handleSelectUser(user)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
