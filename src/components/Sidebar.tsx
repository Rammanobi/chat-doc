import { Plus, Clock, Settings, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { theme } = useTheme();
  
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
          <li className="mb-4">
            <a href="#" className={`flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}>
              Saved Snippets
            </a>
          </li>
          <li className="mb-4">
            <a href="#" className={`flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}>
              Summarize All Docs
            </a>
          </li>
          <li className="mb-4">
            <a href="#" className={`flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}>
              Voice chat mode
            </a>
          </li>
          <li className="mb-4">
            <a href="#" className={`flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}>
              Extract/Share
            </a>
          </li>
          <li>
            <a href="#" className={`flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}>
              <Settings size={20} className="mr-3" />
              Settings
            </a>
          </li>
        </ul>
      </nav>
      <div>
        <a href="#" className={`flex items-center p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-300'}`}>
          <User size={20} className="mr-3" />
          Profile Name
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
