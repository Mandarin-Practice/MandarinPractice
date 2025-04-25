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
  
  // Perform a word-by-word comparison to account for homophones
  const { correctWordElements, userWordElements } = compareWordByWord(s1, s2);
  
  // Calculate how many words were matched using our homophone-aware algorithm
  const correctWords = correctWordElements.length;
  const userWords = userWordElements.length;
  const correctMatched = correctWordElements.filter(w => w.matched).length;
  const userMatched = userWordElements.filter(w => w.matched).length;
  
  // Combine the percentage of correct words matched and user words matched
  const percentageOfCorrectWordsMatched = correctWords > 0 ? correctMatched / correctWords : 0;
  const percentageOfUserWordsMatched = userWords > 0 ? userMatched / userWords : 0;
  
  // Take the average of the two percentages for a word-based similarity
  const wordBasedSimilarity = (percentageOfCorrectWordsMatched + percentageOfUserWordsMatched) / 2;
  
  // Combine the two similarity measures, giving more weight to the word-based comparison
  similarity = (wordBasedSimilarity * 0.7) + (similarity * 0.3);
  
  // Apply strictness adjustment
  const strictnessFactors = {
    lenient: 1.3,   // Be more forgiving
    moderate: 1.0,  // Normal strictness
    strict: 0.8     // Require more precision
  };
  
  similarity = Math.min(1, similarity * strictnessFactors[matchLevel]);
  
  return similarity;
}

/**
 * Map of Chinese homophones that sound the same and should be treated as equivalent
 * Key: Chinese character, Value: Array of equivalent characters
 */
const chineseHomophones: Record<string, string[]> = {
  '他': ['她', '它'], // tā (he, she, it)
  '她': ['他', '它'], // tā (she, he, it)
  '它': ['他', '她'], // tā (it, he, she)
  '吗': ['嗎', '馬'], // ma (question particle, horse)
  '哪': ['那'], // nǎ/nà (which, that)
  '那': ['哪'], // nà/nǎ (that, which)
  '的': ['得', '地'], // de (possessive, adverbial, etc.)
  '得': ['的', '地'], // de/děi (possessive, must)
  '地': ['的', '得']  // de/dì (adverbial, ground)
};

/**
 * Map of English homophones or gender variations that should be treated as equivalent
 */
const englishAlternatives: Record<string, string[]> = {
  'he': ['she', 'it'],
  'she': ['he', 'it'],
  'it': ['he', 'she'],
  'his': ['her', 'its'],
  'her': ['his', 'its'],
  'its': ['his', 'her'],
  'him': ['her', 'it'],
  'hers': ['his'],
  'himself': ['herself', 'itself'],
  'herself': ['himself', 'itself'],
  'itself': ['himself', 'herself']
};

/**
 * Check if two words are equivalent, including checking homophones
 */
function areWordsEquivalent(word1: string, word2: string): boolean {
  // Exact match
  if (word1.toLowerCase() === word2.toLowerCase()) {
    return true;
  }
  
  // Check Chinese homophones
  const lowerWord1 = word1.toLowerCase();
  const lowerWord2 = word2.toLowerCase();
  
  // Check English alternatives (he/she/it)
  if (englishAlternatives[lowerWord1] && englishAlternatives[lowerWord1].includes(lowerWord2)) {
    return true;
  }
  
  if (englishAlternatives[lowerWord2] && englishAlternatives[lowerWord2].includes(lowerWord1)) {
    return true;
  }
  
  // Check if either word contains any Chinese homophone
  for (const char of word1) {
    if (chineseHomophones[char]) {
      for (const homophone of chineseHomophones[char]) {
        if (word2.includes(homophone)) {
          return true;
        }
      }
    }
  }
  
  for (const char of word2) {
    if (chineseHomophones[char]) {
      for (const homophone of chineseHomophones[char]) {
        if (word1.includes(homophone)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Compare two sentences word by word to identify matched and unmatched words
 * Takes into account Chinese homophones (她/他/它) and English gender variations (he/she/it)
 * 
 * @param correctSentence The correct sentence (reference)
 * @param userSentence The user's sentence to compare
 * @returns Object with arrays for rendering matched/unmatched words
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

  // Try exact matches or homophone matches at same position first
  for (let i = 0; i < normUserWords.length && i < normCorrectWords.length; i++) {
    if (normUserWords[i] === normCorrectWords[i] || areWordsEquivalent(originalUserWords[i], originalCorrectWords[i])) {
      userWordElements[i].matched = true;
      correctWordElements[i].matched = true;
    }
  }

  // First pass: Find remaining exact matches or homophone matches anywhere
  for (let i = 0; i < normUserWords.length; i++) {
    // Skip already matched words
    if (userWordElements[i].matched) continue;
    
    const userWord = normUserWords[i];
    if (userWord.length === 0) continue;
    
    // Try to find in the entire correct sentence
    for (let j = 0; j < normCorrectWords.length; j++) {
      if (correctWordElements[j].matched) continue;
      
      if (userWord === normCorrectWords[j] || areWordsEquivalent(originalUserWords[i], originalCorrectWords[j])) {
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
