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
 * Normalize a string for comparison by removing punctuation and extra spaces
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
  // Split sentences by words, preserving original capitalization for display
  const originalCorrectWords = correctSentence.split(/\s+/).filter(word => word.trim() !== '');
  const originalUserWords = userSentence.split(/\s+/).filter(word => word.trim() !== '');
  
  // Normalize words for comparison (lowercase, remove punctuation)
  const normCorrectWords = originalCorrectWords.map(word => 
    word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
  );
  const normUserWords = originalUserWords.map(word => 
    word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
  );
  
  // Initialize arrays to store match status for each word with original capitalization
  const correctWordElements: { word: string; matched: boolean }[] = originalCorrectWords.map(word => ({ 
    word, 
    matched: false 
  }));
  
  const userWordElements: { word: string; matched: boolean }[] = originalUserWords.map(word => ({ 
    word, 
    matched: false 
  }));

  // Try exact matches at same position first
  for (let i = 0; i < normUserWords.length && i < normCorrectWords.length; i++) {
    if (normUserWords[i] === normCorrectWords[i]) {
      userWordElements[i].matched = true;
      correctWordElements[i].matched = true;
    }
  }

  // First pass: Find remaining exact matches anywhere
  for (let i = 0; i < normUserWords.length; i++) {
    // Skip already matched words
    if (userWordElements[i].matched) continue;
    
    const userWord = normUserWords[i];
    if (userWord.length === 0) continue;
    
    // Try to find in the entire correct sentence
    for (let j = 0; j < normCorrectWords.length; j++) {
      if (correctWordElements[j].matched) continue;
      
      if (userWord === normCorrectWords[j]) {
        userWordElements[i].matched = true;
        correctWordElements[j].matched = true;
        break;
      }
    }
  }
  
  // Second pass: Find words with high similarity
  for (let i = 0; i < normUserWords.length; i++) {
    // Skip already matched words
    if (userWordElements[i].matched) continue;
    
    const userWord = normUserWords[i];
    if (userWord.length < 2) continue;
    
    // Look for similar words in the entire correct sentence
    for (let j = 0; j < normCorrectWords.length; j++) {
      if (correctWordElements[j].matched) continue;
      
      const correctWord = normCorrectWords[j];
      if (correctWord.length < 2) continue;
      
      // Calculate word similarity
      const distance = levenshteinDistance(userWord, correctWord);
      const maxLength = Math.max(userWord.length, correctWord.length);
      const wordSimilarity = 1 - (distance / maxLength);
      
      // Even short words can match if they're very similar
      const similarityThreshold = (userWord.length <= 3 || correctWord.length <= 3) ? 0.85 : 0.75;
      
      // If words are very similar, mark as matched
      if (wordSimilarity > similarityThreshold) {
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
