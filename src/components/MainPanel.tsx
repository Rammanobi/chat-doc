import React, { useCallback, useState } from 'react';
import { ArrowRight, Mic } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ChatMessages, { Message as ChatMessage } from './ChatMessages';
import UploadPopover from './UploadPopover';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useSelectedDoc } from '../contexts/SelectedDocContext';
import { useChatSessions } from '../contexts/ChatSessionsContext';

const MainPanel: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  // Messages are managed per-session via ChatSessionsContext
  const { activeSession, addMessage, setTitleIfEmptyFromFirstUser } = useChatSessions();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Active document is managed globally by SelectedDocContext (kept in sync via DocumentList)
  const { selectedDocId } = useSelectedDoc();

  // MainPanel no longer selects documents itself; it trusts SelectedDocContext kept by DocumentList.

  const ask = useCallback(async () => {
    if (!user) {
      addMessage({ id: `${Date.now()}_sys_auth`, text: 'You need to sign in to ask a question.', sender: 'system' });
      return;
    }
    if (!input.trim()) return;
    if (!selectedDocId) {
      addMessage({ id: `${Date.now()}_sys_nodoc`, text: 'Please select or upload a document, then try again.', sender: 'system' });
      return;
    }

    const question = input.trim();
    setInput('');
    const userMsg: ChatMessage = { id: `${Date.now()}_u`, text: question, sender: 'user' };
    addMessage(userMsg);
    setTitleIfEmptyFromFirstUser(question);

    setLoading(true);
    try {
      const callable = httpsCallable<{ question: string; documentId: string }, { answer: string }>(
        functions,
        'askQuestion'
      );
      const result = await callable({ question, documentId: selectedDocId });
      const answer = (result.data as any)?.answer ?? 'No answer returned.';
      addMessage({ id: `${Date.now()}_a`, text: answer, sender: 'ai' });
    } catch (err: any) {
      console.error('Error asking question:', err);
      // Map backend errors to helpful UI messages
      const code: string | undefined = err?.code;
      const msg: string | undefined = err?.message;
      let message = 'Sorry, I encountered an error.';
      if (code?.includes('unauthenticated')) {
        message = 'You need to sign in to ask a question.';
      } else if (code?.includes('invalid-argument') && msg?.toLowerCase().includes('documentid')) {
        message = 'Please select a document first.';
      } else if (code?.includes('not-found')) {
        message = 'Selected document was not found. Please re-select or upload again.';
      } else if (code?.includes('failed-precondition') || msg?.toLowerCase().includes('no extracted text')) {
        message = 'Your document is still being processed. Please try again in a few moments.';
      } else {
        message = 'Please make sure you have uploaded a document and try again.';
      }
      addMessage({ id: `${Date.now()}_sys_err`, text: message, sender: 'system' });
    } finally {
      setLoading(false);
    }
  }, [functions, input, selectedDocId, user, addMessage, setTitleIfEmptyFromFirstUser]);

  return (
    <div className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm opacity-90">
          <ArrowRight size={18} className="opacity-70" />
          <span>New Page</span>
        </div>
        <button onClick={toggleTheme} className="flex items-center gap-2 text-sm">
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          <div className={`w-12 h-6 rounded-full ml-1 flex items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
            <div className={`w-6 h-6 bg-white rounded-full transform transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </button>
      </div>

      {/* Chat area with placeholder */}
      <div className="flex-1 relative">
        {activeSession.messages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-xl md:text-2xl font-semibold opacity-80">Chat DOC – AI Assistant</h1>
          </div>
        )}
        <ChatMessages messages={activeSession.messages} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-gray-700">
        <div className="relative flex items-center gap-2">
          <div className="absolute left-3">
            <UploadPopover />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder={selectedDocId ? 'Type your message' : 'Upload a document to begin...'}
            className={`w-full rounded-md pl-12 pr-24 py-2 outline-none ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'}`}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                ask();
              }
            }}
            disabled={loading}
          />
          <div className="absolute right-3 flex items-center gap-2">
            <button type="button" className="p-2 opacity-80 hover:opacity-100" title="Voice">
              <Mic size={18} />
            </button>
            <button
              type="button"
              onClick={ask}
              disabled={loading || !input.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${loading || !input.trim() ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              title="Send"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPanel;