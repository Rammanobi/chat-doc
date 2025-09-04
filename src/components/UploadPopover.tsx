// src/components/UploadPopover.tsx
import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "../firebase"; // Use our centralized firebase instances
import { Paperclip, X } from "lucide-react";

export default function UploadPopover() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);

    // We can create a user-specific folder if auth.currentUser is available
    const storageRef = ref(storage, `documents/${file.name}-${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed",
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(prog);
      },
      (error) => {
        console.error("Upload failed", error);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, "documents"), {
          fileName: file.name,
          size: file.size,
          url,
          createdAt: serverTimestamp(),
          status: "uploaded"
        });
        setUploading(false);
        setOpen(false); // close popover after upload
      }
    );
  };

  return (
    <div className="relative inline-block">
      {/* Icon to toggle popover */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-700 transition"
      >
        <Paperclip size={20} />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute bottom-12 -left-2 bg-gray-800 text-white text-sm p-3 rounded-lg shadow-lg w-56">
           <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Upload Files</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                <X size={16} />
            </button>
          </div>
          <label className="cursor-pointer flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md">
            <Paperclip size={16} />
            <span>Select file</span>
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx, .txt"
              onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
            />
          </label>
          {uploading && (
            <div className="mt-2 text-xs">
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="mt-1">Uploading… {progress.toFixed(0)}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
