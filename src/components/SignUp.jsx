import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../firebase';
import { motion } from 'framer-motion';
import '../styles/SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to create an account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="signup-container"
    >
      <div className="signup-card">
        <div className="signup-header">
          <h2 className="signup-title">
            Create your account
          </h2>
          <p className="signup-subtitle">Join our community today</p>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="signup-error"
          >
            <svg className="signup-error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        <motion.form 
          className="signup-form"
          onSubmit={handleSubmit}
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          <div className="signup-input-group" style={{ '--order': 1 }}>
            <label htmlFor="email" className="signup-label">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="signup-input"
              placeholder="your@email.com"
            />
          </div>

          <div className="signup-input-group" style={{ '--order': 2 }}>
            <label htmlFor="password" className="signup-label">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="signup-input"
              placeholder="••••••••"
            />
            <div className="password-strength">
              <div className="strength-meter"></div>
            </div>
          </div>

          <div className="signup-input-group" style={{ '--order': 3 }}>
            <label htmlFor="confirmPassword" className="signup-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="signup-input"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="signup-button"
          >
            {loading ? (
              <span className="signup-spinner"></span>
            ) : (
              'Sign Up'
            )}
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
};

export default SignUp;