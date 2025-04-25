import { apiRequest } from './queryClient';

/**
 * Generate an example sentence using a specific Chinese word
 * @param word The Chinese word to use in the sentence
 * @returns Object with Chinese sentence, pinyin, and English translation
 */
export async function generateSentence(word: string): Promise<{
  chinese: string;
  pinyin: string;
  english: string;
}> {
  try {
    const response = await apiRequest('POST', '/api/sentence/generate/word', { word });
    
    if (!response.ok) {
      throw new Error('Failed to generate sentence');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating sentence:', error);
    throw error;
  }
}