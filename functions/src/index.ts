import {onCall} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {GoogleGenerativeAI} from "@google/generative-ai";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyCn7V4pYPXIvndmQ9M4m__65QH0Xrpufeg");

/**
 * Cloud Function to handle document Q&A
 */
export const askQuestion = onCall(async (request) => {
  const {question, userId, documentId} = request.data;

  try {
    // 1. Get document from Firestore
    const docRef = db.collection("documents").doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Document not found");
    }

    const documentData = doc.data();
    const documentText = documentData?.extractedText || "";

    // 2. Split into chunks (simple version)
    const chunks = splitIntoChunks(documentText, 1000);

    // 3. Find relevant chunks
    const relevantChunks = await findRelevantChunks(question, chunks);

    // 4. Call Gemini AI
    const model = genAI.getGenerativeModel({model: "gemini-pro"});
    const prompt = `
Question: ${question}

Document content:
${relevantChunks.join("\n\n")}

Please answer the question based on the document. Include citations if possible.
`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    // 5. Save conversation
    await db.collection("conversations").add({
      question,
      answer,
      userId,
      documentId,
      timestamp: new Date(),
    });

    return {answer};
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to process question");
  }
});

/**
 * Helper function to split text into chunks
 * @param {string} text - The text to split into chunks
 * @param {number} maxLength - Maximum length of each chunk
 * @return {string[]} Array of text chunks
 */
function splitIntoChunks(text: string, maxLength: number): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += maxLength) {
    chunks.push(words.slice(i, i + maxLength).join(" "));
  }

  return chunks;
}

/**
 * Helper function to find relevant chunks
 * @param {string} question - The user's question
 * @param {string[]} chunks - Array of text chunks to search through
 * @return {Promise<string[]>} Array of relevant chunks
 */
async function findRelevantChunks(
  question: string,
  chunks: string[]
): Promise<string[]> {
  // Simple version: return first 2 chunks
  // In production, you'd use AI to find the most relevant ones
  return chunks.slice(0, 2);
}
 