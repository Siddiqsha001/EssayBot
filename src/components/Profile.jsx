import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    bio: '',
    interests: [],
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: ''
    }
  });

  return (
    <div className="page-container">
      <motion.div className="content-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <motion.div 
            className="flex items-center mb-8"
            initial={{ x: -50 }}
            animate={{ x: 0 }}
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              {profile.name.charAt(0) || 'U'}
            </motion.div>
            <div className="ml-6">
              <motion.h1 
                className="text-3xl font-bold text-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {profile.name || 'User Profile'}
              </motion.h1>
              <motion.p 
                className="text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {profile.email}
              </motion.p>
            </div>
          </motion.div>

          {editing ? (
            <ProfileEditForm profile={profile} setProfile={setProfile} setEditing={setEditing} />
          ) : (
            <ProfileView profile={profile} setEditing={setEditing} />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

const ProfileView = ({ profile, setEditing }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.4 }}
  >
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">About Me</h2>
      <p className="text-gray-600">{profile.bio || 'No bio added yet.'}</p>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setEditing(true)}
      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
    >
      Edit Profile
    </motion.button>
  </motion.div>
);

const ProfileEditForm = ({ profile, setProfile, setEditing }) => (
  <motion.form
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.4 }}
    className="space-y-6"
  >
    <div>
      <label className="block text-sm font-medium text-gray-700">Name</label>
      <motion.input
        whileFocus={{ scale: 1.02 }}
        type="text"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Bio</label>
      <motion.textarea
        whileFocus={{ scale: 1.02 }}
        value={profile.bio}
        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
        className="mt-1 w-full p-2 border rounded-lg h-32 focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div className="flex space-x-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setEditing(false)}
        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
      >
        Save Changes
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setEditing(false)}
        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
      >
        Cancel
      </motion.button>
    </div>
  </motion.form>
);

export default Profile;
