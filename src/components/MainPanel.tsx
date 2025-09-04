import { ArrowRight, Sun, Mic, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import UploadPopover from './UploadPopover';

const MainPanel = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <header className={`p-4 flex justify-between items-center ${theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
        <div className="flex items-center">
          <ArrowRight size={20} className="mr-2" />
          <span>New Page</span>
        </div>
        <div className="flex items-center cursor-pointer" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} className="mr-2" /> : <Moon size={20} className="mr-2" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          <div className={`w-12 h-6 rounded-full ml-2 flex items-center transition-colors ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
            <div className={`w-6 h-6 bg-white rounded-full transform transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Chat DOC – Al Assistant</h1>
      </main>
      <footer className={`p-4 ${theme === 'dark' ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
        <div className="relative flex items-center">
          <UploadPopover />
          <input
            type="text"
            placeholder="Type your message"
            className={`w-full rounded-md p-3 pl-12 pr-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
            <button className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
              <Mic size={20} />
            </button>
            <button className="ml-2 w-6 h-6 bg-gray-600 rounded-full"></button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainPanel;
