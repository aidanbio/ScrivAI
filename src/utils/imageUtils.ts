// Imports removed as they are no longer needed
// export const restoreImagesFromDB = ... removed

/**
 * Prepares HTML content for saving.
 * It ensures data-image-id is present (it should be) and clears the src to avoid saving Blob URLs.
 * NOTE: Tiptap's HTML serialization creates the HTML string we receive here.
 * If we modify it, we are modifying the string that gets saved.
 */
export const prepareContentForSave = (html: string): string => {
  if (!html) return '';
  // Since we are now using server URLs, we want to persist the src attribute.
  // We no longer need to clear it or rely solely on data-image-id for blob restoration.
  return html;
};


export const compressImage = async (file: File, maxSizeMB: number = 5): Promise<{ blob: Blob, wasCompressed: boolean, originalSize: number }> => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size <= maxBytes) {
    return { blob: file, wasCompressed: false, originalSize: file.size };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if too large (e.g., > 1920px) to help with size
        const MAX_DIMENSION = 1920;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
             if (width > height) {
                 height *= MAX_DIMENSION / width;
                 width = MAX_DIMENSION;
             } else {
                 width *= MAX_DIMENSION / height;
                 height = MAX_DIMENSION;
             }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, wasCompressed: true, originalSize: file.size });
          } else {
            reject(new Error('Compression failed'));
          }
        }, 'image/webp', 0.8); // WebP with 0.8 quality
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
