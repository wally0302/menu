/**
 * Resizes an image to a maximum dimension while maintaining aspect ratio.
 * This is crucial for performance and reducing token usage before sending to AI.
 */
export const resizeImage = (file: File, maxDimension: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Return base64 string without prefix for Gemini API compatibility if needed, 
        // but typically we keep the data URI prefix for preview, then strip it for API.
        resolve(canvas.toDataURL('image/jpeg', 0.8)); 
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string;
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const stripBase64Prefix = (dataUrl: string): string => {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
};