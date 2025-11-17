import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCamera, FaEdit, FaSave, FaTimes, FaSignOutAlt, FaUser, FaEnvelope, FaAlignLeft } from 'react-icons/fa';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchFollowStats();
  }, [user]);

  const fetchFollowStats = async () => {
    if (!user?._id) return;
    
    try {
      const [followersRes, followingRes] = await Promise.all([
        api.get(`/users/${user._id}/followers`),
        api.get(`/users/${user._id}/following`),
      ]);
      setFollowersCount(followersRes.data.count);
      setFollowingCount(followingRes.data.count);
    } catch (error) {
      console.error('Error fetching follow stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (avatarFile) {
        const formDataAvatar = new FormData();
        formDataAvatar.append('avatar', avatarFile);
        await api.post('/users/avatar', formDataAvatar, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      await api.put('/users/profile', formData);
      toast.success('Profile updated successfully!');
      setEditing(false);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/chat')}
            className="group flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 font-medium"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" /> 
            <span>Back to Chat</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          {/* Profile Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32 relative"></div>
          
          <div className="px-8 pb-10">
            {/* Avatar */}
            <div className="flex justify-center -mt-16 mb-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt={user?.username}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-xl transition-transform duration-300 group-hover:scale-105"
                  />
                  {editing && (
                    <label className="absolute bottom-1 right-1 p-3 bg-blue-500 text-white rounded-full cursor-pointer hover:bg-blue-600 transition-all duration-300 shadow-lg transform hover:scale-110 border-2 border-white dark:border-slate-800">
                      <FaCamera className="text-sm" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                {user?.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                {user?.email}
              </p>
            </div>

            {/* Follow Stats */}
            <div className="flex gap-4 mb-10 max-w-md mx-auto">
              <div className="flex-1 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-5 border border-blue-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {statsLoading ? '...' : followersCount}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wide">Followers</p>
              </div>
              <div className="flex-1 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-5 border border-blue-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {statsLoading ? '...' : followingCount}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wide">Following</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Username Field */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <FaUser className="text-blue-500" />
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:border-blue-400 font-medium"
                />
              </div>

              {/* Email Field */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <FaEnvelope className="text-blue-500" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 opacity-60 cursor-not-allowed font-medium"
                />
              </div>

              {/* Bio Field */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <FaAlignLeft className="text-blue-500" />
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!editing}
                  rows={4}
                  className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:border-blue-400 resize-none font-medium leading-relaxed"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
                    >
                      <FaSave className="text-lg" /> 
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          username: user?.username || '',
                          bio: user?.bio || '',
                        });
                        setAvatarPreview(user?.avatar || '');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-xl font-semibold transition-all duration-300 border-2 border-gray-200 dark:border-slate-600 transform hover:scale-105"
                    >
                      <FaTimes className="text-lg" /> Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FaEdit className="text-lg" /> Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
