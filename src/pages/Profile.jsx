import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../firebase';
import { FiUser, FiBook, FiTarget, FiGlobe, FiClock, FiSave } from 'react-icons/fi';
import '../styles/Profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    dob: '',
    academicLevel: '',
    writingStyle: '',
    targetExam: '',
    favoriteTopics: [],
    writingGoals: [],
    practiceFrequency: 'weekly',
    location: '',
    readingLevel: 'intermediate',
    preferredFeedbackType: 'detailed',
    nativeLanguage: '',
  });

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(currentUser.uid);
        if (data) {
          setProfile(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) {
      setError("Please log in to save your profile");
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        ...profile,
        updatedAt: new Date().toISOString()
      });
      setError(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profile-loading">Loading...</div>;

  return (
    <div className="profile-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-content"
      >
        <div className="profile-header">
          <h2 className="profile-title">My Profile</h2>
          <p className="profile-subtitle">Customize your learning experience</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">
                <FiUser className="section-icon" />
                Basic Information
              </h3>
              <div className="form-group">
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Full Name"
                  className="form-input"
                />
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  className="form-input"
                />
                <input
                  type="email"
                  value={currentUser?.email}
                  disabled
                  className="form-input disabled"
                />
              </div>
            </div>

            {/* Academic Profile */}
            <div className="form-section">
              <h3 className="section-title">
                <FiBook className="section-icon" />
                Academic Profile
              </h3>
              <select
                value={profile.academicLevel}
                onChange={(e) => setProfile({ ...profile, academicLevel: e.target.value })}
                className="form-select"
              >
                <option value="">Select Academic Level</option>
                <option value="high_school">High School</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="professional">Professional</option>
              </select>
              
              <select
                value={profile.readingLevel}
                onChange={(e) => setProfile({ ...profile, readingLevel: e.target.value })}
                className="form-select"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Writing Preferences */}
            <div className="form-section">
              <h3 className="section-title">
                <FiTarget className="section-icon" />
                Writing Preferences
              </h3>
              <input
                type="text"
                value={profile.writingStyle}
                onChange={(e) => setProfile({ ...profile, writingStyle: e.target.value })}
                placeholder="Writing Style"
                className="form-input"
              />
              <select
                value={profile.preferredFeedbackType}
                onChange={(e) => setProfile({ ...profile, preferredFeedbackType: e.target.value })}
                className="form-select"
              >
                <option value="quick">Quick Tips</option>
                <option value="detailed">Detailed Review</option>
                <option value="grade">Grade Only</option>
              </select>
            </div>
          </div>

          <button type="submit" className="save-button" disabled={saving}>
            <FiSave className="button-icon" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
