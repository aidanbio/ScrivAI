import { saveImageToDB, getImageFromDB } from './idb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Restores images in HTML content by fetching Blobs from IndexedDB using data-image-id.
 */
export const restoreImagesFromDB = async (html: string): Promise<string> => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  const promises = Array.from(images).map(async (img) => {
    const imageId = img.getAttribute('data-image-id');
    if (imageId) {
      try {
        const blob = await getImageFromDB(imageId);
        if (blob) {
          const url = URL.createObjectURL(blob);
          img.setAttribute('src', url);
        }
      } catch (error) {
        console.error(`Failed to restore image ${imageId}`, error);
      }
    }
  });

  await Promise.all(promises);
  return doc.body.innerHTML;
};

/**
 * Prepares HTML content for saving.
 * It ensures data-image-id is present (it should be) and clears the src to avoid saving Blob URLs.
 * NOTE: Tiptap's HTML serialization creates the HTML string we receive here.
 * If we modify it, we are modifying the string that gets saved.
 */
export const prepareContentForSave = (html: string): string => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  images.forEach(img => {
    if (img.getAttribute('data-image-id')) {
      // Clear src to save space and avoid invalid blob refs in DB
      // We can use a placeholder or empty string
      img.setAttribute('src', ''); 
    }
  });

  return doc.body.innerHTML;
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
