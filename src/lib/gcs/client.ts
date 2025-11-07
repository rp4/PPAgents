import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
let storage: Storage;

if (process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64) {
  // For deployment (e.g., Cloud Run, Vercel)
  const credentials = JSON.parse(
    Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8')
  );
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials,
  });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // For local development with service account file
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
} else {
  // For environments with default credentials (e.g., running on GCP)
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
  });
}

const bucketName = process.env.GCP_STORAGE_BUCKET || '';

if (!bucketName) {
  console.warn('GCP_STORAGE_BUCKET environment variable is not set');
}

export const bucket = storage.bucket(bucketName);

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadFile(
  destination: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
    },
    resumable: false,
  });

  return destination;
}

/**
 * Get a signed URL for temporary file access
 */
export async function getSignedUrl(
  filePath: string,
  expiryMinutes: number = 60
): Promise<string> {
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiryMinutes * 60 * 1000,
  });

  return url;
}

/**
 * Get a signed URL for file upload
 */
export async function getUploadSignedUrl(
  filePath: string,
  mimeType: string,
  expiryMinutes: number = 15
): Promise<string> {
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiryMinutes * 60 * 1000,
    contentType: mimeType,
  });

  return url;
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const file = bucket.file(filePath);
  await file.delete();
}

/**
 * List files in a directory
 */
export async function listFiles(prefix: string): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix });
  return files.map((file) => file.name);
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  return exists;
}

/**
 * Make a file public
 */
export async function makeFilePublic(filePath: string): Promise<string> {
  const file = bucket.file(filePath);
  await file.makePublic();
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

/**
 * Get public URL for a file (without making it public)
 */
export function getPublicUrl(filePath: string): string {
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

export default storage;
