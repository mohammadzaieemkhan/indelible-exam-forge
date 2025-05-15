
/**
 * Proxy service to call Supabase edge functions
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Extract text from an image using OCR
 */
export const extractTextFromImage = async (imageBase64: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('extract-text', {
      body: { imageBase64 }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error("Error calling extract-text function:", error);
    throw error;
  }
};
