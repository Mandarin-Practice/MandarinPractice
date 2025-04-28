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
 * Lists of words that are not critical for meaning but often appear in sentences
 * These words don't significantly change the meaning when added/omitted
 */
const nonCriticalWords: Record<string, string[]> = {
  english: [
    "a", "an", "the", "this", "that", "these", "those",
    "is", "am", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "by", "with", "to", "for", "from", "of",
    "and", "or", "but", "so", "very", "quite", "really",
    "just", "now", "then", "there", "here", "already"
  ]
};

/**
 * Lists of common words/phrases with similar meanings that should be treated as equivalent
 * These words or phrases are considered semantically equivalent and should match each other
 */
const equivalentPhrases: Array<string[]> = [
  // Verbs with similar meaning
  ["study", "learn", "studying", "learning"],
  ["see", "look at", "looking at", "viewing", "watching"],
  ["eat", "have a meal", "having a meal", "having food", "having dinner", "having lunch", "having breakfast"],
  ["drink", "having a drink"],
  ["walk", "walking", "go", "going"],
  ["say", "tell", "saying", "telling"],
  ["buy", "purchase", "buying", "purchasing"],
  ["like", "enjoy", "loves", "enjoys"],
  ["want", "would like", "would love", "wishes"],
  ["give", "hand", "pass", "giving", "handing", "passing"],
  ["speak", "talk", "speaking", "talking"],
  
  // Time expressions
  ["now", "at the moment", "currently", "at present", "right now"],
  ["later", "afterwards", "after that"],
  ["today", "this day"],
  ["yesterday", "the day before"],
  ["tomorrow", "the next day"],
  ["every day", "daily", "each day"],
  ["morning", "in the morning", "during the morning", "a.m."],
  ["afternoon", "in the afternoon", "during the afternoon", "p.m."],
  ["evening", "in the evening", "during the evening", "at night", "night"],
  
  // Locations
  ["at home", "in the house", "at the house", "in home", "in my home", "in his home", "in her home"],
  ["at school", "in school", "at the school", "in the school"],
  ["at work", "in work", "at the office", "in the office"],
  ["at the library", "in the library"],
  ["at the restaurant", "in the restaurant"],
  ["at the store", "in the store", "at the shop", "in the shop"],
  
  // Pronouns and other common substitutions
  ["he's", "he is", "he was"],
  ["she's", "she is", "she was"],
  ["it's", "it is", "it was"],
  ["I'm", "I am"],
  ["you're", "you are"],
  ["they're", "they are"],
  ["there's", "there is", "there was"],
  ["that's", "that is", "that was"],
  ["we're", "we are"],
  
  // Prepositions that often vary
  ["in the", "at the"],
  ["on the", "at the"],
  
  // Tense/aspect/mood markers (often interchangeable in translations)
  ["will", "going to", "will be", "is going to"],
  ["was", "has been", "had been"],
  ["is", "was being", "has been"],
];

/**
 * Check if a word is considered non-critical for meaning
 */
function isNonCriticalWord(word: string): boolean {
  const normalized = word.toLowerCase().trim();
  return nonCriticalWords.english.includes(normalized);
}

/**
 * Check if two phrases are considered equivalent
 */
function arePhrasesEquivalent(phrase1: string, phrase2: string): boolean {
  const normalized1 = phrase1.toLowerCase().trim();
  const normalized2 = phrase2.toLowerCase().trim();
  
  // Check if they're exact matches
  if (normalized1 === normalized2) return true;
  
  // Check against our list of equivalent phrases
  for (const equivalentGroup of equivalentPhrases) {
    const containsPhrase1 = equivalentGroup.some(phrase => 
      normalized1 === phrase || normalized1.includes(phrase)
    );
    
    const containsPhrase2 = equivalentGroup.some(phrase => 
      normalized2 === phrase || normalized2.includes(phrase)
    );
    
    if (containsPhrase1 && containsPhrase2) return true;
  }
  
  return false;
}

/**
 * Extract main content words from a sentence (nouns, verbs, adjectives)
 * A simple implementation that excludes common non-critical words
 */
function extractContentWords(sentence: string): string[] {
  const normalized = normalizeString(sentence);
  const words = normalized.split(/\s+/);
  return words.filter(word => !isNonCriticalWord(word) && word.length > 1);
}

/**
 * Assess if two sentences are semantically similar (have the same main meaning)
 * This is a more forgiving check than exact string similarity
 */
function assessSemanticSimilarity(str1: string, str2: string): number {
  const contentWords1 = extractContentWords(str1);
  const contentWords2 = extractContentWords(str2);
  
  if (contentWords1.length === 0 || contentWords2.length === 0) return 0;
  
  // Check how many content words from sentence 1 have an equivalent in sentence 2
  let matchedWords = 0;
  
  for (const word1 of contentWords1) {
    // Check for direct word matches or equivalent phrases
    const hasEquivalent = contentWords2.some(word2 => 
      word1 === word2 || 
      arePhrasesEquivalent(word1, word2) ||
      areWordsEquivalent(word1, word2) ||
      // For longer words (likely more important), allow partial matches with high similarity
      (word1.length > 3 && word2.length > 3 && 
        (word1.includes(word2) || word2.includes(word1) || 
         levenshteinDistance(word1, word2) / Math.max(word1.length, word2.length) < 0.3)
      )
    );
    
    if (hasEquivalent) matchedWords++;
  }
  
  // Calculate the semantic similarity score (percentage of content words matched)
  const semanticScore = matchedWords / contentWords1.length;
  
  // Check if key elements like subject, verb, object are present
  // We'll do a simpler version by checking if the beginning, middle, and end have some matches
  
  // If contentWords1 has more than 3 words, check if words from different parts have matches
  if (contentWords1.length >= 3) {
    const beginning = contentWords1.slice(0, Math.ceil(contentWords1.length / 3));
    const middle = contentWords1.slice(Math.ceil(contentWords1.length / 3), Math.ceil(2 * contentWords1.length / 3));
    const end = contentWords1.slice(Math.ceil(2 * contentWords1.length / 3));
    
    let partsMatched = 0;
    
    // Check if at least one word from beginning matches
    if (beginning.some(word => contentWords2.some(w2 => word === w2 || arePhrasesEquivalent(word, w2)))) {
      partsMatched++;
    }
    
    // Check if at least one word from middle matches
    if (middle.some(word => contentWords2.some(w2 => word === w2 || arePhrasesEquivalent(word, w2)))) {
      partsMatched++;
    }
    
    // Check if at least one word from end matches
    if (end.some(word => contentWords2.some(w2 => word === w2 || arePhrasesEquivalent(word, w2)))) {
      partsMatched++;
    }
    
    // Boost score if different parts of the sentence have matches
    const distributionBonus = (partsMatched / 3) * 0.2;
    return Math.min(1, semanticScore + distributionBonus);
  }
  
  return semanticScore;
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
  
  // Get semantic similarity score (meaning-based comparison)
  const semanticSimilarity = assessSemanticSimilarity(s1, s2);
  
  // Combine the similarity measures with weights based on match level
  let combinedSimilarity;
  switch (matchLevel) {
    case 'lenient':
      // In lenient mode, prioritize semantic meaning over exact wording
      combinedSimilarity = (semanticSimilarity * 0.6) + (wordBasedSimilarity * 0.3) + (similarity * 0.1);
      break;
    case 'moderate':
      // Balanced approach
      combinedSimilarity = (semanticSimilarity * 0.4) + (wordBasedSimilarity * 0.4) + (similarity * 0.2);
      break;
    case 'strict':
      // In strict mode, require more exact matching but still consider meaning
      combinedSimilarity = (semanticSimilarity * 0.2) + (wordBasedSimilarity * 0.5) + (similarity * 0.3);
      break;
    default:
      combinedSimilarity = (semanticSimilarity * 0.4) + (wordBasedSimilarity * 0.4) + (similarity * 0.2);
  }
  
  // Apply strictness adjustment for final score
  const strictnessFactors = {
    lenient: 1.3,   // Be more forgiving
    moderate: 1.0,  // Normal strictness
    strict: 0.8     // Require more precision
  };
  
  // Apply strictness factor and cap at 1.0
  let finalSimilarity = Math.min(1, combinedSimilarity * strictnessFactors[matchLevel]);
  
  // For debugging (can be removed in production)
  // console.log('Semantic:', semanticSimilarity, 'Word-based:', wordBasedSimilarity, 'Edit-distance:', similarity, 'Final:', finalSimilarity);
  
  return finalSimilarity;
}

/**
 * Map of Chinese pronoun homophones that should be treated as equivalent when heard
 * These are specifically: 他(he), 她(she), and 它(it) which sound identical in Mandarin
 * Key: Chinese character, Value: Array of equivalent characters
 */
const chineseHomophones: Record<string, string[]> = {
  '他': ['她', '它'], // he, she, it - all sound identical
  '她': ['他', '它'], // she, he, it - all sound identical
  '它': ['他', '她']  // it, he, she - all sound identical
};

/**
 * Map of English pronoun variations that should be treated as equivalent
 * These correspond to the Chinese 他/她/它 which can't be distinguished by listening
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
 * Takes into account Chinese pronoun homophones (她/他/它) and English gender variations (he/she/it)
 * These are treated equivalently since they sound identical in Mandarin and can't be distinguished by listening
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
