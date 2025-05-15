
/**
 * Extract text from an image using Gemini AI
 */
export const extractTextFromImage = async (
  imageBase64: string
): Promise<{ success: boolean; text?: string; error?: string }> => {
  try {
    console.log("Extracting text from image with Gemini AI...");
    
    const { data, error } = await fetch('/api/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 })
    }).then(res => res.json());
    
    if (error) {
      console.error("Error extracting text from image:", error);
      return { success: false, error: error };
    }
    
    return { success: true, text: data.text };
  } catch (error) {
    console.error("Error in text extraction:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};
