import Compressor from 'compressorjs';

/**
 * Compress an image file using Compressor.js
 * Reduces file size significantly before uploading to server
 * 
 * @param {File|Blob} file The input file from file input
 * @param {Object} options Custom options for compressorjs
 * @returns {Promise<{ file: File, originalSize: number, compressedSize: number, ratio: number }>}
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('File tidak ditemukan'));
    }

    // Only compress image types
    if (!file.type || !file.type.startsWith('image/')) {
      return resolve({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        ratio: 0,
      });
    }

    const originalSize = file.size;

    new Compressor(file, {
      quality: options.quality || 0.75,
      maxWidth: options.maxWidth || 1600,
      maxHeight: options.maxHeight || 1600,
      mimeType: options.mimeType || 'image/jpeg',
      convertSize: options.convertSize || 800000, // 800KB
      success(result) {
        // Ensure result is a File with the proper name
        const compressedFile = new File([result], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        const compressedSize = compressedFile.size;
        const ratio = originalSize > 0 
          ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
          : 0;

        resolve({
          file: compressedFile,
          originalSize,
          compressedSize,
          ratio,
        });
      },
      error(err) {
        console.warn('CompressorJS warning (fallback to original):', err.message);
        // Fallback gracefully to original file
        resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          ratio: 0,
        });
      },
    });
  });
};

/**
 * Format bytes to readable string (e.g. 1.2 MB, 450 KB)
 */
export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
