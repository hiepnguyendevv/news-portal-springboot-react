import React from 'react';

export const useUploader = () => {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const uploadFile = React.useCallback(async (file) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Upload failed');
      }
      let result;
      try {
        result = await response.json();
      } catch (e) {
        const text = await response.text();
        throw new Error(text || 'Invalid JSON response');
      }
      if (!result?.url) throw new Error('Missing url in response');
      return result.url;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, error, uploadFile };
};
