export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Converts all Base64 images in the HTML string to Blob URLs.
 * Should be called when loading data into the editor.
 */
export const convertContentToBlobs = (html: string): string => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('data:')) {
      const blob = dataURLToBlob(src);
      const url = URL.createObjectURL(blob);
      img.setAttribute('src', url);
    }
  });

  return doc.body.innerHTML;
};

/**
 * Converts all Blob URLs in the HTML string back to Base64 Data URLs.
 * Should be called before saving data to storage.
 */
export const convertContentToBase64 = async (html: string): Promise<string> => {
  if (!html) return '';
  // We need to render the HTML in a way we can access the blobs.
  // Since Blob URLs are valid in the current session, fetching them works.
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  const promises = Array.from(images).map(async (img) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('blob:')) {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const dataUrl = await blobToDataURL(blob);
        img.setAttribute('src', dataUrl);
      } catch (error) {
        console.error('Failed to convert blob to base64', error);
        // Keep original src if failed, or maybe handle error
      }
    }
  });

  await Promise.all(promises);
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

        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, wasCompressed: true, originalSize: file.size });
          } else {
            reject(new Error('Compression failed'));
          }
        }, 'image/jpeg', 0.7); // 0.7 quality
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
