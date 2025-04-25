/**
 * Calculate the Levenshtein distance between two strings
 * @param a First string
 * @param b Second string
 * @returns The edit distance between the two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalize a string for comparison
 * @param str String to normalize
 * @returns Normalized string
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()                           // Convert to lowercase
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
    .replace(/\s{2,}/g, " ")                 // Remove extra spaces
    .trim();                                 // Trim whitespace
}

/**
 * Calculate the similarity between two strings as a number between 0 and 1
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @param matchLevel Strictness level of comparison
 * @returns A number between 0 and 1, where 1 is an exact match
 */
export function checkSimilarity(
  str1: string,
  str2: string,
  matchLevel: 'lenient' | 'moderate' | 'strict' = 'moderate'
): number {
  // Normalize both strings
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  // Handle empty strings
  if (s1.length === 0 || s2.length === 0) {
    return 0;
  }
  
  // For very short answers, use exact matching with more tolerance
  if (s1.length < 5 || s2.length < 5) {
    return s1 === s2 ? 1 : 0;
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  
  // Calculate maximum possible distance
  const maxLength = Math.max(s1.length, s2.length);
  
  // Calculate raw similarity score (1 - normalized distance)
  let similarity = 1 - distance / maxLength;
  
  // Apply strictness adjustment
  const strictnessFactors = {
    lenient: 1.3,   // Be more forgiving
    moderate: 1.0,  // Normal strictness
    strict: 0.8     // Require more precision
  };
  
  similarity = Math.min(1, similarity * strictnessFactors[matchLevel]);
  
  // Handle key word matching for lenient mode
  if (matchLevel === 'lenient') {
    // Split into words and find common ones
    const words1 = s1.split(' ');
    const words2 = s2.split(' ');
    
    let matchCount = 0;
    for (const word1 of words1) {
      if (word1.length < 3) continue; // Skip very short words
      for (const word2 of words2) {
        if (word2.length < 3) continue;
        if (word1 === word2 || levenshteinDistance(word1, word2) <= 1) {
          matchCount++;
          break;
        }
      }
    }
    
    // Calculate word-based similarity
    const keywordSimilarity = words1.length > 0 ? matchCount / words1.length : 0;
    
    // Use the better of the two scores
    similarity = Math.max(similarity, keywordSimilarity);
  }
  
  return similarity;
}

/**
 * Compare two sentences word by word to identify matched and unmatched words
 * @param correctSentence The correct sentence (reference)
 * @param userSentence The user's sentence to compare
 * @returns Object with HTML-ready arrays for rendering matched/unmatched words
 */
export function compareWordByWord(
  correctSentence: string,
  userSentence: string
): { 
  correctWordElements: { word: string; matched: boolean }[],
  userWordElements: { word: string; matched: boolean }[] 
} {
  const correctWords = normalizeString(correctSentence).split(' ');
  const userWords = normalizeString(userSentence).split(' ');
  
  // Initialize arrays to store match status for each word
  const correctWordElements: { word: string; matched: boolean }[] = correctWords.map(word => ({ 
    word, 
    matched: false 
  }));
  
  const userWordElements: { word: string; matched: boolean }[] = userWords.map(word => ({ 
    word, 
    matched: false 
  }));

  // First pass: Find exact matches
  for (let i = 0; i < userWords.length; i++) {
    const userWord = userWords[i];
    
    // Skip very short words or already matched words
    if (userWord.length < 2 || userWordElements[i].matched) continue;
    
    // Try to find exact match at the same position or nearby
    const searchStart = Math.max(0, i - 1);
    const searchEnd = Math.min(correctWords.length - 1, i + 1);
    
    for (let j = searchStart; j <= searchEnd; j++) {
      if (userWord === correctWords[j] && !correctWordElements[j].matched) {
        userWordElements[i].matched = true;
        correctWordElements[j].matched = true;
        break;
      }
    }
  }
  
  // Second pass: Find words with high similarity
  for (let i = 0; i < userWords.length; i++) {
    const userWord = userWords[i];
    
    // Skip very short words or already matched words
    if (userWord.length < 3 || userWordElements[i].matched) continue;
    
    // Look for similar words in the entire correct sentence
    for (let j = 0; j < correctWords.length; j++) {
      const correctWord = correctWords[j];
      
      // Skip very short words or already matched words
      if (correctWord.length < 3 || correctWordElements[j].matched) continue;
      
      // Calculate word similarity
      const distance = levenshteinDistance(userWord, correctWord);
      const maxLength = Math.max(userWord.length, correctWord.length);
      const wordSimilarity = 1 - (distance / maxLength);
      
      // If words are very similar, mark as matched
      if (wordSimilarity > 0.75) {
        userWordElements[i].matched = true;
        correctWordElements[j].matched = true;
        break;
      }
    }
  }
  
  return {
    correctWordElements,
    userWordElements
  };
}
