import { apiRequest } from './queryClient';

/**
 * Check if two English words or phrases are synonyms
 * @param word1 First word/phrase to compare
 * @param word2 Second word/phrase to compare
 * @returns Boolean indicating if they are considered synonyms
 */
export async function checkIfSynonyms(word1: string, word2: string): Promise<boolean> {
  try {
    const response = await fetch('/api/synonym-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word1, word2 }),
    });

    if (!response.ok) {
      throw new Error('Failed to check synonyms');
    }

    const result = await response.json();
    return result.areSynonyms;
  } catch (error) {
    console.error('Error checking synonyms:', error);
    // Fallback to basic string similarity if API fails
    const similarity = 1 - (levenshteinDistance(word1.toLowerCase(), word2.toLowerCase()) / 
                           Math.max(word1.length, word2.length));
    return similarity > 0.8;
  }
}

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