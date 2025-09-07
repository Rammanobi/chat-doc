import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Loader, CheckCircle } from 'lucide-react';

interface Document {
  id: string;
  fileName: string;
  status: string;
  createdAt: Timestamp;
}

const DocumentList = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, 'documents'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: Document[] = [];
      querySnapshot.forEach((doc: DocumentData) => {
        docs.push({ id: doc.id, ...doc.data() } as Document);
      });
      // Sort by creation date, newest first
      docs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching documents: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'processing':
        return <Loader size={16} className="text-yellow-500 animate-spin" />;
      default:
        return <FileText size={16} />;
    }
  };

  if (loading) {
    return <div className="text-xs text-center p-2">Loading documents...</div>;
  }

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <h3 className="text-sm font-semibold mb-2 px-2">Your Documents</h3>
      {documents.length > 0 ? (
        <ul>
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between p-2 rounded-md text-sm hover:bg-gray-700">
              <span className="truncate flex-grow">{doc.fileName}</span>
              {getStatusIcon(doc.status)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 px-2">No documents uploaded yet.</p>
      )}
    </div>
  );
};

export default DocumentList;
