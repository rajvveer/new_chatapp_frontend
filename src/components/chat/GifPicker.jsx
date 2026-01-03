import { useState, useEffect } from 'react';
import { FaTimes, FaSearch } from 'react-icons/fa';

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'; 

const GifPicker = ({ onGifSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGifs();
  }, [searchTerm]);

  const fetchGifs = async () => {
    setLoading(true);
    try {
      const endpoint = searchTerm
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=20`
        : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20`;

      const response = await fetch(endpoint);
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error('Failed to fetch GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGifClick = (gif) => {
    const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url;
    if (gifUrl) {
      onGifSelect(gifUrl);
    }
  };

  return (
    <div className="absolute bottom-20 left-6 z-50 w-96 max-w-[90vw]">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Choose a GIF</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
          >
            <FaTimes className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* GIF Grid */}
        <div className="h-96 overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <div
                  key={gif.id}
                  onClick={() => handleGifClick(gif)}
                  className="cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img
                    src={gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url}
                    alt={gif.content_description}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && gifs.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              No GIFs found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 bg-gray-50 dark:bg-slate-900 text-center">
          <a
            href="https://tenor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            Powered by Tenor
          </a>
        </div>
      </div>
    </div>
  );
};

export default GifPicker;
