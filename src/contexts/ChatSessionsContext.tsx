import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import type { Message as ChatMessage } from '../components/ChatMessages';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export interface ChatSession {
  id: string;
  title: string; // first user message or "New Chat"
  messages: ChatMessage[];
  createdAt: number;
}

interface ChatSessionsContextType {
  sessions: ChatSession[];
  activeSessionId: string;
  activeSession: ChatSession;
  newSession: () => void;
  switchSession: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setTitleIfEmptyFromFirstUser: (text: string) => void;
}

const ChatSessionsContext = createContext<ChatSessionsContextType | undefined>(undefined);

export const ChatSessionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({});

  const activeSession = useMemo(() => {
    const base = sessions.find(s => s.id === activeSessionId) || sessions[0];
    if (!base) {
      return { id: '', title: 'New Chat', messages: [], createdAt: Date.now() };
    }
    const msgs = messagesBySession[base.id] || [];
    return { ...base, messages: msgs } as ChatSession;
  }, [sessions, activeSessionId, messagesBySession]);

  const newSession = async () => {
    if (!user) return;
    const sessionsCol = collection(db, 'users', user.uid, 'sessions');
    const ref = await addDoc(sessionsCol, {
      title: 'New Chat',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setActiveSessionId(ref.id);
  };

  const switchSession = (id: string) => {
    setActiveSessionId(id);
  };

  const addMessage = async (msg: ChatMessage) => {
    if (!user || !activeSessionId) return;
    const messagesCol = collection(db, 'users', user.uid, 'sessions', activeSessionId, 'messages');
    await addDoc(messagesCol, {
      text: msg.text,
      sender: msg.sender,
      timestamp: serverTimestamp(),
    });
    // updatedAt on session
    const sessionRef = doc(db, 'users', user.uid, 'sessions', activeSessionId);
    await updateDoc(sessionRef, { updatedAt: serverTimestamp() }).catch(() => {});
  };

  const setTitleIfEmptyFromFirstUser = async (text: string) => {
    if (!user || !activeSessionId) return;
    const title = text.trim() ? text.trim().slice(0, 40) : 'New Chat';
    const sessionRef = doc(db, 'users', user.uid, 'sessions', activeSessionId);
    await updateDoc(sessionRef, { title, updatedAt: serverTimestamp() }).catch(async () => {
      await setDoc(sessionRef, { title, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    });
  };

  // Subscribe to sessions for the logged-in user
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setActiveSessionId('');
      setMessagesBySession({});
      return;
    }
    const sessionsCol = collection(db, 'users', user.uid, 'sessions');
    const q = query(sessionsCol, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: ChatSession[] = snap.docs.map((d) => ({
        id: d.id,
        title: (d.data() as any)?.title || 'New Chat',
        messages: [],
        createdAt: Date.now(),
      }));
      setSessions(next);
      // Ensure we have an active session selected
      if (!activeSessionId && next.length > 0) {
        setActiveSessionId(next[0].id);
      }
    });
    return () => unsub();
  }, [user]);

  // Subscribe to messages for the active session
  useEffect(() => {
    if (!user || !activeSessionId) return;
    const messagesCol = collection(db, 'users', user.uid, 'sessions', activeSessionId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return { id: d.id, text: data.text || '', sender: data.sender || 'system' } as ChatMessage;
      });
      setMessagesBySession((prev) => ({ ...prev, [activeSessionId]: msgs }));
    });
    return () => unsub();
  }, [user, activeSessionId]);

  const value: ChatSessionsContextType = {
    sessions,
    activeSessionId,
    activeSession,
    newSession,
    switchSession,
    addMessage,
    setTitleIfEmptyFromFirstUser,
  };

  return (
    <ChatSessionsContext.Provider value={value}>
      {children}
    </ChatSessionsContext.Provider>
  );
};

export const useChatSessions = () => {
  const ctx = useContext(ChatSessionsContext);
  if (!ctx) throw new Error('useChatSessions must be used within ChatSessionsProvider');
  return ctx;
};
