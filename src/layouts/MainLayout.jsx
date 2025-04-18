import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiCode, FiClipboard, FiCalendar, FiUser, FiLogOut } from 'react-icons/fi';
import './MainLayout.css'; // Assuming you have a CSS file for styles
const MainLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/essaybot', label: 'AI EssayBot', icon: <FiCode /> },
    { path: '/aitester', label: 'Test AI', icon: <FiClipboard /> },
    { path: '/calendar', label: 'Calendar', icon: <FiCalendar /> },
    { path: '/profile', label: 'Profile', icon: <FiUser /> }
  ];

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-indigo-50 text-indigo-600 font-medium' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 flex">
      <aside className="w-64 bg-white shadow-lg rounded-l-xl flex flex-col">
      <div class="branding">Essay Master AI</div>

  {/* Move nav directly below title with tighter padding */}
  <nav className="flex-1 px-4 pt-4 space-y-1">
    {navItems.map(({ path, label, icon }) => (
      <Link key={path} to={path} className={getLinkClass(path)}>
        <span className="text-sm">{icon}</span>
        <span className="text-sm">{label}</span>
      </Link>
    ))}

    <button
      onClick={() => {
        logout();
        navigate('/login');
      }}
      
      className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 mt-4 text-sm"
    >
      <FiLogOut className="text-sm" />
      <span>Logout</span>
    </button>
    
  </nav>
</aside>


        <main className="flex-1 bg-white shadow-lg rounded-r-xl overflow-hidden">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
