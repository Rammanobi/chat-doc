import { useTheme } from '../contexts/ThemeContext';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const { theme } = useTheme();

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg p-3 max-w-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              <p>{message.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatMessages;
