import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaComments, FaUserPlus, FaUserMinus, FaCircle } from 'react-icons/fa';
import api from '../utils/api';
import { useChatStore } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { createConversation, setSelectedConversation } = useChatStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUser();
    checkFollowStatus();
    fetchFollowCounts();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const { data } = await api.get(`/users/${userId}`);
      setUser(data.data);
    } catch (error) {
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setIsFollowing(data.data.friends?.includes(userId) || false);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        api.get(`/users/${userId}/followers`),
        api.get(`/users/${userId}/following`),
      ]);
      setFollowersCount(followersRes.data.count);
      setFollowingCount(followingRes.data.count);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  const handleFollow = async () => {
    setActionLoading(true);
    try {
      await api.post(`/users/${userId}/follow`);
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      toast.success(`Following ${user.username}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/users/${userId}/follow`);
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
      toast.success(`Unfollowed ${user.username}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unfollow user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const conversation = await createConversation(userId);
      setSelectedConversation(conversation);
      navigate('/chat');
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 mb-8 font-medium"
        >
          <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
          <span>Back</span>
        </button>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32 relative"></div>

          <div className="px-8 pb-10">
            {/* Avatar Section */}
            <div className="flex justify-center -mt-16 mb-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <img
                    src={user?.avatar}
                    alt={user?.username}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-xl transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Online Status Badge */}
                  <div className="absolute bottom-2 right-2">
                    {user?.isOnline ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-green-500 p-2 rounded-full border-4 border-white dark:border-slate-800 shadow-lg">
                          <FaCircle className="text-white text-xs" />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-400 p-2 rounded-full border-4 border-white dark:border-slate-800 shadow-lg">
                        <FaCircle className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                {user?.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base mb-3">
                {user?.email}
              </p>
              
              {/* Online Status Text */}
              {user?.isOnline ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Online</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded-full border border-gray-200 dark:border-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Offline</span>
                </div>
              )}
            </div>

            {/* Follow Stats */}
            <div className="flex gap-4 mb-8 max-w-md mx-auto">
              <div className="flex-1 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-5 border border-blue-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {followersCount}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wide">
                  Followers
                </p>
              </div>
              <div className="flex-1 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-5 border border-blue-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {followingCount}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wide">
                  Following
                </p>
              </div>
            </div>

            {/* Bio Section */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  About
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {user?.bio || 'No bio available'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="max-w-2xl mx-auto flex gap-4">
                {isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 dark:border-slate-600 transform hover:scale-105 disabled:hover:scale-100 shadow-md hover:shadow-lg"
                  >
                    <FaUserMinus className="text-lg" />
                    {actionLoading ? 'Unfollowing...' : 'Unfollow'}
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                  >
                    <FaUserPlus className="text-lg" />
                    {actionLoading ? 'Following...' : 'Follow'}
                  </button>
                )}

                <button
                  onClick={handleStartChat}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FaComments className="text-lg" />
                  Message
                </button>
              </div>
            )}

            {/* Own Profile Message */}
            {isOwnProfile && (
              <div className="max-w-2xl mx-auto text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <p className="text-blue-700 dark:text-blue-400 font-medium">
                    This is your profile
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="mt-4 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
