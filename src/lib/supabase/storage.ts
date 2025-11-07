// DEPRECATED: Storage moved to Google Cloud Storage
// This file is a stub for backward compatibility

export const uploadFile = async () => {
  throw new Error('Use GCS upload API');
};

export const deleteFile = async () => {
  throw new Error('Use GCS delete API');
};

export const getPublicUrl = (path: string) => {
  return '';
};
