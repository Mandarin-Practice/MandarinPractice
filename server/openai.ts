import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "your-api-key" });

/**
 * Check if two English words or phrases are synonyms
 * @param word1 First word or phrase
 * @param word2 Second word or phrase
 * @returns Object with boolean indicating if they are synonyms
 */
export async function checkSynonyms(word1: string, word2: string): Promise<{ areSynonyms: boolean; confidence: number }> {
  if (!word1 || !word2) {
    throw new Error("Both words are required for synonym check");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a language learning assistant helping students check if two English words or phrases are synonyms or have equivalent meanings in the context of language translation.
          
          For example:
          - "pretty" and "beautiful" are synonyms
          - "big" and "large" are synonyms
          - "eat" and "have a meal" are equivalent expressions
          - "apple" and "banana" are NOT synonyms
          
          Provide your assessment as a JSON object with 'areSynonyms' (boolean) and 'confidence' (number between 0 and 1) properties.`
        },
        {
          role: "user",
          content: `Are these two words/phrases synonyms or equivalent in meaning: "${word1}" and "${word2}"?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const generatedContent = response.choices[0].message.content;
    if (!generatedContent) {
      throw new Error("No content generated");
    }

    const parsedContent = JSON.parse(generatedContent);
    return {
      areSynonyms: parsedContent.areSynonyms,
      confidence: parsedContent.confidence
    };
  } catch (error) {
    console.error("Error checking synonyms:", error);
    // Fallback to basic string similarity if the API call fails
    const similarity = 1 - (levenshteinDistance(word1.toLowerCase(), word2.toLowerCase()) / 
                         Math.max(word1.length, word2.length));
    return { 
      areSynonyms: similarity > 0.8,
      confidence: similarity
    };
  }
}

/**
 * Calculate Levenshtein distance between two strings
 * (Helper function for synonym fallback)
 */
function levenshteinDistance(a: string, b: string): number {
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
 * Generate a Mandarin sentence using only provided vocabulary
 * @param vocabulary Array of vocabulary words to use in sentence
 * @param difficulty Difficulty level of the sentence
 * @returns Object with chinese, pinyin, and english translation
 */
export async function generateSentence(
  vocabulary: { chinese: string; pinyin: string; english: string }[],
  difficulty: "beginner" | "intermediate" | "advanced" = "beginner"
) {
  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("No vocabulary provided");
  }

  const chineseWords = vocabulary.map((word) => word.chinese).join(", ");
  const pinyinMap = vocabulary.reduce(
    (map, word) => {
      map[word.chinese] = word.pinyin;
      return map;
    },
    {} as Record<string, string>
  );
  const englishMap = vocabulary.reduce(
    (map, word) => {
      map[word.chinese] = word.english;
      return map;
    },
    {} as Record<string, string>
  );

  // Get current date and time for context in sentences
  const now = new Date();
  const hour = now.getHours();
  const dayTime = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  const season = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"][now.getMonth()];

  const difficultyGuide = {
    beginner: "Use simple sentence structures with basic subject-verb patterns. Include 3-5 words.",
    intermediate: "Use more complex grammar with some compounds and basic conjunctions. Include 5-8 words.",
    advanced: "Use sophisticated grammar and sentence structures. Include 8-10 words or more."
  };

  // Pick one sentence pattern to specifically request
  const sentencePatterns = [
    "Create a question using 吗, 呢, or 吧.",
    "Create an imperative statement (a command or request).",
    "Create a comparison between two things.",
    "Create an if/then conditional statement.",
    "Create a sentence expressing an opinion or preference.",
    "Create a time-based sentence about a daily routine.",
    "Create a descriptive sentence about weather, food, or a place.",
    "Create a cause and effect relationship sentence.",
    "Create a sentence about future plans or intentions.",
    "Create a sentence with a location expression.",
    `Create a sentence about ${dayTime} activities.`,
    `Create a sentence mentioning it's ${dayOfWeek}.`,
    `Create a seasonal sentence about ${season}.`,
    "Create a sentence with a negative statement (using 不 or 没).",
    "Create a sentence about wanting or needing something.",
    "Create a sentence with emotional expression (happy, sad, tired, etc)."
  ];

  // Randomly select a sentence pattern to request
  const randomPattern = sentencePatterns[Math.floor(Math.random() * sentencePatterns.length)];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Mandarin Chinese language teacher creating practice sentences for students.
          Generate a grammatically correct Mandarin sentence using ONLY the vocabulary words provided.
          ${difficultyGuide[difficulty]}
          
          You must create highly varied sentence structures. Avoid repetitive patterns.
          
          Include different sentence types:
          - Questions (using 吗, 呢, 吧)
          - Imperative statements (commands or requests)
          - Comparison sentences
          - If/then structures
          - Opinion statements
          - Time-based sentences (morning, afternoon, days of week, seasons)
          - Descriptive sentences
          - Cause and effect relationships
          - Negative statements
          - Emotional expressions
          - Location expressions
          
          Provide the sentence in Chinese characters, pinyin (with proper tone marks), and an English translation.
          Important: ONLY use words from the provided vocabulary list. If you need common connecting words like "的" or "是", you may use them ONLY if they're in the vocabulary list.
          Format your response as a valid JSON object with 'chinese', 'pinyin', and 'english' fields.`
        },
        {
          role: "user",
          content: `Vocabulary words (in Chinese): ${chineseWords}. 
          Difficulty level: ${difficulty}.
          
          For this specific request: ${randomPattern}
          
          Generate a sentence using only these words. Make it sound natural and conversational.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const generatedContent = response.choices[0].message.content;
    if (!generatedContent) {
      throw new Error("No content generated");
    }

    const parsedContent = JSON.parse(generatedContent);
    
    // Validate that the sentence uses mostly words from the vocabulary
    const sentenceWords = parsedContent.chinese.replace(/[，。！？]/g, '').split('');
    
    // Create a unique array of characters in a simpler way
    const uniqueSentenceWords: string[] = [];
    for (const char of sentenceWords) {
      if (!uniqueSentenceWords.includes(char)) {
        uniqueSentenceWords.push(char);
      }
    }
    
    // Common Chinese characters that are allowed regardless of difficulty level
    // These are basic characters like particles, pronouns, and common verbs
    const commonChineseChars = ['的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '们', '这', '那', '不', '很', '都', '也', '个', '吗', '吧', '呢', '啊', '就', '说', '能', '要', '会', '对', '给', '到', '得', '着', '过', '被', '上', '下', '前', '后', '里', '外', '左', '右', '中', '大', '小', '多', '少', '好', '与', '为', '因'];
    
    // Create a vocabulary set of all characters in the vocabulary
    const vocabularySet = new Set(vocabulary.map(w => w.chinese).join('').split(''));
    
    // For beginner difficulty, be very strict - only allow characters in the vocabulary
    if (difficulty === "beginner") {
      const validSentence = uniqueSentenceWords.every((word: string) => 
        vocabularySet.has(word) || word.trim() === '' || /\s/.test(word) || commonChineseChars.includes(word)
      );
      
      if (!validSentence) {
        throw new Error("Beginner level sentences must only use vocabulary from the list");
      }
    } 
    // For intermediate difficulty, allow some common characters not in vocabulary
    else if (difficulty === "intermediate" || difficulty === "advanced") {
      // Count characters that are neither in vocabulary nor in common chars
      const unknownChars = uniqueSentenceWords.filter((word: string) => 
        !vocabularySet.has(word) && !commonChineseChars.includes(word) && word.trim() !== '' && !/\s/.test(word)
      );
      
      // For intermediate, allow at most 20% unknown characters
      const maxUnknownRatio = difficulty === "intermediate" ? 0.2 : 0.35; // 20% for intermediate, 35% for advanced
      const unknownRatio = unknownChars.length / uniqueSentenceWords.length;
      
      // Verify that the sentence isn't too complex
      if (unknownRatio > maxUnknownRatio) {
        throw new Error(`${difficulty} level sentences have too many unknown characters (${unknownRatio.toFixed(2)})`);
      }
    }
    
    return {
      ...parsedContent,
      difficulty
    };
  } catch (error) {
    console.error("Error generating sentence:", error);
    throw new Error("Failed to generate sentence. Please try again.");
  }
}

/**
 * Generate a Mandarin sentence that includes a specific word
 * @param word The Chinese word to include in the sentence
 * @param difficulty Difficulty level of the sentence
 * @returns Object with chinese, pinyin, and english fields
 */
export async function generateSentenceWithWord(
  word: string,
  difficulty: "beginner" | "intermediate" | "advanced" = "beginner"
) {
  if (!word || word.trim() === '') {
    throw new Error("No word provided");
  }

  // Get current date and time for context in sentences
  const now = new Date();
  const hour = now.getHours();
  const dayTime = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  const season = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"][now.getMonth()];

  const difficultyGuide = {
    beginner: "Use simple sentence structures with basic subject-verb patterns. Include 3-5 words.",
    intermediate: "Use more complex grammar with some compounds and basic conjunctions. Include 5-8 words.",
    advanced: "Use sophisticated grammar and sentence structures. Include 8-10 words or more."
  };

  // Pick one sentence pattern to specifically request
  const sentencePatterns = [
    "Create a question using 吗, 呢, or 吧.",
    "Create an imperative statement (a command or request).",
    "Create a comparison between two things.",
    "Create an if/then conditional statement.",
    "Create a sentence expressing an opinion or preference.",
    "Create a time-based sentence about a daily routine.",
    "Create a descriptive sentence about weather, food, or a place.",
    "Create a cause and effect relationship sentence.",
    "Create a sentence about future plans or intentions.",
    "Create a sentence with a location expression.",
    `Create a sentence about ${dayTime} activities.`,
    `Create a sentence mentioning it's ${dayOfWeek}.`,
    `Create a seasonal sentence about ${season}.`,
    "Create a sentence with a negative statement (using 不 or 没).",
    "Create a sentence about wanting or needing something.",
    "Create a sentence with emotional expression (happy, sad, tired, etc)."
  ];

  // Randomly select a sentence pattern to request
  const randomPattern = sentencePatterns[Math.floor(Math.random() * sentencePatterns.length)];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Mandarin Chinese language teacher creating example sentences. 
          Generate a grammatically correct Mandarin sentence that includes the word "${word}".
          ${difficultyGuide[difficulty]}
          
          You must create highly varied sentence structures. Avoid repetitive patterns.
          
          Include different sentence types:
          - Questions (using 吗, 呢, 吧)
          - Imperative statements (commands or requests)
          - Comparison sentences
          - If/then structures
          - Opinion statements
          - Time-based sentences (morning, afternoon, days of week, seasons)
          - Descriptive sentences
          - Cause and effect relationships
          - Negative statements
          - Emotional expressions
          - Location expressions
          
          Provide the sentence in Chinese characters, pinyin (with proper tone marks), and an English translation.
          Format your response as a valid JSON object with 'chinese', 'pinyin', and 'english' fields.`
        },
        {
          role: "user",
          content: `Create a natural, grammatically correct sentence in Mandarin that includes the word "${word}".
          Difficulty level: ${difficulty}.
          
          For this specific request: ${randomPattern}
          
          Make it sound natural and conversational while ensuring the sentence includes "${word}".`
        }
      ],
      response_format: { type: "json_object" }
    });

    const generatedContent = response.choices[0].message.content;
    if (!generatedContent) {
      throw new Error("No content generated");
    }

    const parsedContent = JSON.parse(generatedContent);
    
    // Validate that the sentence contains the requested word
    if (!parsedContent.chinese.includes(word)) {
      throw new Error("Generated sentence does not contain the specified word");
    }
    
    return {
      ...parsedContent,
      difficulty
    };
  } catch (error) {
    console.error("Error generating sentence:", error);
    throw new Error("Failed to generate example sentence. Please try again.");
  }
}
