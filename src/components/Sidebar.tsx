import { Plus, Clock, Settings, User, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // User will be redirected to login page by the ProtectedRoute
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  return (
    <div className={`w-64 p-4 flex flex-col transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative absolute h-full z-10 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Chatdoc</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          <li className="mb-4">
            <a href="#" className={`flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}>
              <Plus size={20} className="mr-3" />
              New Chat
            </a>
          </li>
          <li className="mb-4">
            <a href="#" className={`flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}>
              <Clock size={20} className="mr-3" />
              History
            </a>
          </li>
          {/* Add other nav items here */}
        </ul>
      </nav>
      {user && (
        <div>
          <div className={`flex items-center p-2 rounded-md mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <User size={20} className="mr-3" />
            <span>{user.displayName || user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
