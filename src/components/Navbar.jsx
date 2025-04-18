import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import '../styles/Navbar.css';
import '../styles/Auth.css'
const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <NavLink to="/" className="navbar-brand">
        <motion.span>Evalio</motion.span>
      </NavLink>
      
      <div className="nav-container">
        <div className="nav-links">
          <motion.div whileHover={{ scale: 1.05 }}>
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              Home
            </NavLink>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }}>
            <NavLink 
              to="/essaybot" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              EssayBot
            </NavLink>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }}>
            <NavLink 
              to="/aitester" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              AI Tester
            </NavLink>
          </motion.div>
          
          {isAuthenticated && (
            <>
              <motion.div whileHover={{ scale: 1.05 }}>
                <NavLink 
                  to="/dashboard" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Dashboard
                </NavLink>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }}>
                <NavLink 
                  to="/profile" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Profile
                </NavLink>
              </motion.div>
            </>
          )}
        </div>
        
        <div className="auth-buttons">
          {!isAuthenticated ? (
            <>
              <motion.div whileHover={{ scale: 1.05 }}>
                <NavLink 
                  to="/login" 
                  className={({ isActive }) => `login-button ${isActive ? 'active' : ''}`}
                >
                  Login
                </NavLink>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <NavLink 
                  to="/signup" 
                  className={({ isActive }) => `signup-button ${isActive ? 'active' : ''}`}
                >
                  Sign Up
                </NavLink>
              </motion.div>
            </>
          ) : (
            <motion.button 
              onClick={handleLogout}
              className="logout-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;