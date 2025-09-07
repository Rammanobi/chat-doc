import { useState } from 'react';
import { ArrowRight, Sun, Mic, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import UploadPopover from './UploadPopover';
import ChatMessages, { Message } from './ChatMessages';

const MainPanel = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! Please upload a document to get started.', sender: 'ai' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedDocumentId] = useState<string | null>(null); // Remove setter since we're not using it yet
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: Date.now().toString() + '-loading',
      text: 'Thinking...',
      sender: 'ai',
    };
    setMessages(prev => [...prev, loadingMessage]);

    // Call the Cloud Function
    try {
      const functions = getFunctions();
      const askQuestion = httpsCallable(functions, 'askQuestion');

      const result = await askQuestion({
        question: currentInput,
        userId: user?.uid,
        documentId: selectedDocumentId || 'test-doc' // Use selected document or fallback
      });
      
      // Type the result data properly
      const responseData = result.data as { answer: string };
      
      // Remove loading message and add real response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id);
        return [...withoutLoading, {
          id: Date.now().toString() + '-ai',
          text: responseData.answer,
          sender: 'ai',
        }];
      });
    } catch (error) {
      console.error('Error asking question:', error);
      
      // Remove loading message and add error response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id);
        return [...withoutLoading, {
          id: Date.now().toString() + '-ai',
          text: 'Sorry, I encountered an error. Please make sure you have uploaded a document and try again.',
          sender: 'ai',
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      <main className="flex-1 flex flex-col">
        <ChatMessages messages={messages} />
      </main>
      <footer className={`p-4 ${theme === 'dark' ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <UploadPopover />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message"
            disabled={isLoading}
            className={`w-full rounded-md p-3 pl-12 pr-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} ${isLoading ? 'opacity-50' : ''}`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
            <button type="button" className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
              <Mic size={20} />
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className={`ml-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white ${isLoading ? 'opacity-50' : ''}`}
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default MainPanel;