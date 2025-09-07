import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import useMobile from '../hooks/useMobile';
import Sidebar from "../components/Sidebar";
import MainPanel from "../components/MainPanel";
import { Menu } from 'lucide-react';

function ChatPage() {
  const { theme } = useTheme();
  const isMobile = useMobile();
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {isMobile && (
        <button onClick={toggleSidebar} className="absolute top-4 left-4 z-20">
          <Menu size={24} />
        </button>
      )}
      <Sidebar isOpen={isSidebarOpen} />
      <MainPanel />
    </div>
  );
}

export default ChatPage;

