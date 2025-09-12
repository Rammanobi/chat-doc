import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Split text into ~1000 character chunks (simple and fast for demo)
function chunkTextByChars(text: string, maxChars = 1000): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

export const processUploadedDocument = onObjectFinalized({ bucket: 'chat--doc--1.firebasestorage.app', region: 'us-central1' }, async (event) => {
  const object = event.data;
  try {
    const bucketName = object.bucket;
    const filePath = object.name || '';
    const contentType = object.contentType || '';
    const metadata = (object.metadata || {}) as Record<string, string>;

    logger.info('processUploadedDocument received', { filePath, contentType, metadata });

    // docId from custom metadata preferred; fallback to filename without extension
    let docId = metadata.docId || metadata.docid || '';
    if (!docId) {
      const fileName = path.basename(filePath);
      docId = fileName.replace(path.extname(fileName), '');
    }

    const bucket = admin.storage().bucket(bucketName);
    const tmpDir = os.tmpdir();
    const tmpFilePath = path.join(tmpDir, path.basename(filePath));

    // Mark as processing immediately so UI shows progress
    const db = admin.firestore();
    const docRef = db.collection('documents').doc(docId);
    await docRef.set({
      status: 'processing',
      filePath,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await bucket.file(filePath).download({ destination: tmpFilePath });
    logger.info('Downloaded file', { tmpFilePath });

    const ext = path.extname(tmpFilePath).toLowerCase();
    let extractedText = '';

    try {
      if (ext === '.pdf') {
        const data = fs.readFileSync(tmpFilePath);
        const pdfData = await pdfParse(data);
        extractedText = pdfData?.text || '';
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: tmpFilePath });
        extractedText = result?.value || '';
      } else if (ext === '.txt') {
        extractedText = fs.readFileSync(tmpFilePath, 'utf8');
      } else {
        // Basic fallback try PDF parser
        const data = fs.readFileSync(tmpFilePath);
        const pdfData = await pdfParse(data);
        extractedText = pdfData?.text || '';
      }
    } catch (e) {
      logger.warn('Parsing failed; continuing with empty text', e as any);
      extractedText = '';
    }

    await docRef.set({
      extractedText,
      status: extractedText && extractedText.trim().length > 0 ? 'ready' : 'failed',
      filePath,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    if (extractedText && extractedText.trim().length > 0) {
      const chunks = chunkTextByChars(extractedText, 1000);
      logger.info('Writing chunks', { count: chunks.length, docId });

      const batchSize = 400; // conservative batch size
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = db.batch();
        const slice = chunks.slice(i, i + batchSize);
        slice.forEach((text, idx) => {
          const chunkRef = docRef.collection('chunks').doc();
          batch.set(chunkRef, {
            index: i + idx,
            text,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }
    }

    try { fs.unlinkSync(tmpFilePath); } catch {}
    return;
  } catch (err) {
    logger.error('processUploadedDocument error', err as any);
    throw err;
  }
});
