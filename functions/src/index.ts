import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {GoogleGenerativeAI, TaskType} from "@google/generative-ai";
import {defineSecret} from "firebase-functions/params";
export { processUploadedDocument } from './processUpload';

// Initialize Firebase Admin exactly once
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = getFirestore();

// Define the Gemini API Key as a secret.
// The value is managed by Firebase/Google Cloud.
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Cloud Function to handle document Q&A.
 */
// eslint-disable-next-line max-len
export const askQuestion = onCall({secrets: [geminiApiKey]}, async (request) => {
  const {question, documentId} = (request.data || {}) as {question?: string; documentId?: string};
  const userId = request.auth?.uid || null;

  if (!userId) {
    throw new HttpsError("unauthenticated", "You must be signed in to ask a question.");
  }
  if (!question || !question.trim()) {
    throw new HttpsError("invalid-argument", "Question is required.");
  }
  if (!documentId || !documentId.trim()) {
    throw new HttpsError("invalid-argument", "documentId is required.");
  }

  // Access the secret value at runtime.
  const apiKey = geminiApiKey.value();
  if (!apiKey) {
    throw new HttpsError(
      "failed-precondition",
      "Gemini API key not configured. Run 'firebase functions:secrets:set GEMINI_API_KEY' and deploy."
    );
  }

  // eslint-disable-next-line max-len
  // Initialize the AI client inside the function, where the secret is available.
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 1. Get document from Firestore
    const docRef = db.collection("documents").doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "Document not found");
    }

    const documentData = doc.data() || {};

    // 2. Load precomputed chunks if available; fallback to extractedText split
    let chunks: string[] = [];
    const chunksSnap = await docRef.collection('chunks').orderBy('index', 'asc').get();
    if (!chunksSnap.empty) {
      chunks = chunksSnap.docs.map((d) => (d.data() as any).text || "");
      console.log('Using precomputed chunks:', chunks.length);
    } else {
      const documentText = (documentData as any)?.extractedText || "";
      if (!documentText || !documentText.trim()) {
        throw new HttpsError(
          "failed-precondition",
          "Document has no extracted text yet. Please try again later."
        );
      }
      chunks = chunkTextByChars(documentText, 1000); // 1000-char chunks for speed/demo
      console.log('Using fallback chunks from extractedText:', chunks.length);
    }

    // 3. Prefilter and cap chunks to avoid overloading embeddings on large docs
    const prefiltered = prefilterChunks(question, chunks, 60);
    const relevantChunks = await findRelevantChunks(question, prefiltered, genAI);

    // 4. Call Gemini AI
    // Use a current model; gemini-pro may be retired in some regions
    const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});
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
      timestamp: FieldValue.serverTimestamp(),
    });

    return {answer};
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // Throwing an HttpsError is the proper way to report errors from a callable function.
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while processing your question."
    );
  }
});

/**
 * Helper: split text into ~N-character chunks (fast for demo)
 */
function chunkTextByChars(text: string, maxChars = 1000): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

/**
 * Helper function to find relevant chunks using embeddings.
 * This is a more advanced implementation than the original.
 * In a production application, you would typically pre-calculate and store
 * the embeddings for your document chunks in a vector database for faster retrieval.
 * @param {string} question - The user's question.
 * @param {string[]} chunks - Array of text chunks to search through.
 * @param {GoogleGenerativeAI} genAI - The initialized GenerativeAI client.
 */
async function findRelevantChunks(
  question: string,
  chunks: string[],
  genAI: GoogleGenerativeAI
): Promise<string[]> {
  // eslint-disable-next-line max-len
  const embeddingModel = genAI.getGenerativeModel({model: "text-embedding-004"});

  // 1. Get embedding for the user's question.
  const questionEmbedding = await embeddingModel.embedContent ({ // eslint-disable-line max-len
    content: {parts: [{text: question}], role: "user"},
    taskType: TaskType.RETRIEVAL_QUERY,
  });

  // 2. Get embeddings for all the document chunks.
  // eslint-disable-next-line max-len
  const chunkEmbeddings = await embeddingModel.batchEmbedContents({
    requests: chunks.map((chunk) => ({
      content: {parts: [{text: chunk}], role: "user"},
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    })),
  });

  // 3. Find the most similar chunks to the question using cosine similarity.
  const similarities = chunkEmbeddings.embeddings.map((embedding) =>
    cosineSimilarity(questionEmbedding.embedding.values, embedding.values)
  );

  // 4. Return the top N chunks.
  const topN = 2;
  const topIndices = similarities
    .map((similarity, index) => ({similarity, index}))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN)
    .map((item) => item.index);

  return topIndices.map((index) => chunks[index]);
}

/**
 * Prefilter chunks using simple keyword scoring and cap the number of chunks.
 * This reduces embedding load and prevents timeouts/500s on very large documents.
 */
function prefilterChunks(question: string, chunks: string[], cap = 150): string[] {
  try {
    const terms = (question || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .filter((t) => t.length > 2);
    if (terms.length === 0) {
      return chunks.slice(0, cap);
    }
    const scored = chunks.map((c, i) => {
      const lc = (c || "").toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (lc.includes(t)) score += 1;
      }
      return { i, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, cap).map((s) => chunks[s.i]);
    // If everything scores 0 (no overlap), just take first cap chunks
    if (top.every((c) => !c)) return chunks.slice(0, cap);
    return top;
  } catch {
    return chunks.slice(0, cap);
  }
}

/**
 * Calculates the cosine similarity between two vectors.
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @return {number} The cosine similarity.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}