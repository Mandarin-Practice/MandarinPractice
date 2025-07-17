import { apiRequest } from "@/lib/queryClient";
import { Vocabulary } from "@shared/schema";
import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "your-api-key" });

/**
 * Validates a Chinese sentence for accuracy, grammar, and naturalness using AI
 * @param chinese The Chinese sentence to validate
 * @param difficulty The difficulty level of the sentence
 * @returns Object with validation results and feedback
 */
export async function validateSentenceWithAI(chinese: string, difficulty: string): Promise<{
  isValid: boolean;
  score: number;
  feedback: string;
  corrections?: string;
  translationPreview?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a Mandarin Chinese linguistic expert focusing on accuracy validation. Analyze the following Chinese sentence for grammatical correctness, naturalness, translation quality, and appropriateness for ${difficulty} level learners.
          
          Score the sentence on a scale of 0-10 where:
          - 0-3: Unnatural, grammatically incorrect, or translates awkwardly to English
          - 4-6: Grammatically correct but unnatural or awkward phrasing in either language
          - 7-8: Natural but with minor issues
          - 9-10: Perfect natural sentence in both Chinese and English translation
          
          Provide your evaluation in JSON format with these fields:
          - score: number (0-10)
          - isValid: boolean (true if score >= 7)
          - feedback: concise explanation of your evaluation
          - corrections: suggested corrections if any (or null if none)
          - translationPreview: a natural English translation of the sentence or null if not applicable
          
          Focus on these common issues:
          1. Inappropriate particle usage (的, 了, 和, 在, 吗, etc.)
          2. Unnatural word combinations (e.g., 请你好)
          3. Awkward sentence structure
          4. Incorrect grammar
          5. Cultural appropriateness
          6. Semantic coherence and logical meaning
          7. Translation quality to English
          
          Pay special attention to semantically incorrect phrases like:
          - "学习蛋糕" (studying cake) - nonsensical verb-object pair
          - "你的舞跳得不高" (your dancing is not high) - awkward in English, better would be "你跳舞跳得不好" (you don't dance very well)
          - "吃水" (eating water) or "喝饭" (drinking rice) - incorrect verb-object pairing
          - "我们学习明天" (we study tomorrow) - illogical time reference
          
          If the sentence is incorrect, please remember to put your corrections in the corrections field of the JSON output`
        },
        {
          role: "user",
          content: chinese
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    return {
      isValid: result.isValid || false,
      score: result.score || 0,
      feedback: result.feedback || "No feedback provided",
      corrections: result.corrections || null,
      translationPreview: result.translationPreview || null
    };
  } catch (error) {
    console.error("Error validating sentence with AI:", error);
    // Return a default response that allows the sentence to pass
    // This ensures the feature degrades gracefully if the AI service fails
    return {
      isValid: true,
      score: 7,
      feedback: "Validation service unavailable - sentence passed by default"
    };
  }
}

/**
 * Get the definition and pinyin for a Chinese character
 * @param character The Chinese character to define
 * @returns Object with definition and pinyin
 */
export async function getChineseCharacterDefinition(character: string): Promise<{ definition: string, pinyin: string }> {
  if (!character || character.length !== 1) {
    throw new Error("A single Chinese character is required");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Chinese language expert. Provide accurate definitions and pinyin 
          for Chinese characters. Return only a JSON object with 'definition' (string) containing 
          a brief English explanation (max 5 words) and 'pinyin' (string) with proper tone marks 
          (not numbers).`
        },
        {
          role: "user",
          content: `Define this Chinese character: "${character}"`
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
      definition: parsedContent.definition || `Character ${character}`,
      pinyin: parsedContent.pinyin || character
    };
  } catch (error) {
    console.error(`Error getting definition for character ${character}:`, error);
    return {
      definition: `Character ${character}`,
      pinyin: character
    };
  }
}

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
  difficulty: "beginner" | "intermediate" | "advanced" = "beginner",
  useEnhancedVocabulary: boolean = false
) {
  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("No vocabulary provided");
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

  // Extract all individual characters from the vocabulary words
  const allChars = vocabulary.map(word => word.chinese.split('')).flat();
  console.log(`Available characters from vocabulary: ${allChars.join(', ')}`);
  
  // Get the original words to provide context
  const originalWords = vocabulary.map(word => word.chinese);
  console.log(`Original vocabulary words: ${originalWords.join(', ')}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Mandarin Chinese language teacher creating practice sentences for students.
          Your task is to create grammatically correct and semantically meaningful Mandarin sentences 
          using ONLY characters from the provided vocabulary list.
          
          EXTREMELY IMPORTANT CONSTRAINTS:
          1. ONLY use characters from the provided list - NO exceptions
          2. Create sentences that are SEMANTICALLY MEANINGFUL and LOGICAL
          3. Do not break words into individual characters unless they make sense as standalone words
          4. Names should be kept together as proper names (e.g., 王朋 should be "Wang Peng", not used as separate characters)
          5. Respect the original meaning of each character and word
          6. NEVER create contradictory or impossible statements (e.g., "她男姐姐" is nonsensical because "姐姐" must be female)
          7. ALWAYS maintain real-world logic and consistency
          
          For example:
          - If given "王朋" (Wang Peng), use it as a name, not as separate characters
          - If given "学生" (student), use it as "student", not as separate characters with different meanings
          - If given "美国" (America), use it as "America", not as "beautiful country"
          
          STRICT LOGICAL AND GRAMMATICAL CONSTRAINTS:
          - Family terms must be used correctly (弟弟 = younger brother, 姐姐 = older sister, etc.)
          - Gender terms must be consistent (男 = male, 女 = female)
          - Time expressions must be consistent (明天 = tomorrow, 昨天 = yesterday)
          - Foods must be paired with appropriate verbs (吃 for solid food, 喝 for drinks)
          - Locations and objects must be used realistically
          - Question particles must be used correctly (吗 for yes/no questions, 呢 for "what about" questions)
          - The 吧 particle should only be used for suggestions or mild commands, not after greetings
          - Measure words must match their nouns properly
          - Basic greeting phrases must follow standard patterns (你好, 早上好, etc.)
          
          COMMON GRAMMAR MISTAKES TO AVOID:
          - "你好吧" is incorrect; the proper greeting is just "你好"
          - "我是去" is incorrect; it should be "我去" (I go) or "我要去" (I want to go)
          - "他学三年中文" needs the 了 particle when referring to past: "他学了三年中文"
          - Mixing incompatible particles in the same sentence
          
          ${difficultyGuide[difficulty]}
          
          You must create a sentence that:
          1. ONLY uses characters from the provided character list
          2. Is grammatically correct
          3. Makes logical sense in real-world contexts
          4. Uses words in their proper, natural context
          5. Preserves the meaning of proper names and vocabulary words
          
          Provide the sentence in Chinese characters, pinyin (with proper tone marks), and an English translation.
          Format your response as a valid JSON object with 'chinese', 'pinyin', and 'english' fields.`
        },
        {
          role: "user",
          content: `Original vocabulary words: ${originalWords.join(', ')}
          Individual characters available: ${allChars.join(' ')}
          
          Difficulty level: ${difficulty}
          
          For this specific request: ${randomPattern}
          
          Generate a natural, meaningful sentence that uses these vocabulary words or their characters appropriately.
          The sentence must make logical sense and only use the available characters.
          
          IMPORTANT: Preserve the original meaning of words. If a character is part of a name or multi-character word,
          it should typically be used in that context, not broken apart unless it makes sense to do so.`
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
    
    // Expanded list of common Chinese characters that are always allowed
    // These are basic characters like particles, pronouns, and common verbs
    const commonChineseChars = ['的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '们', '这', '那', '不', '很', '都', '也', '个', '吗', '吧', '呢', '啊', '就', '说', '能', '要', '会', '对', '给', '到', '得', '着', '过', '被', '上', '下', '前', '后', '里', '外', '左', '右', '中', '大', '小', '多', '少', '好', '与', '为', '因', '什么', '谢谢', '再见', '请', '问'];
    
    // Create a vocabulary set of all characters in the vocabulary list
    const allUserVocabulary = await storage.getAllVocabulary(18);
    const vocabularyChars: Set<string> = new Set();
    allUserVocabulary.forEach(word => {
      // Split each Chinese word into characters
      word.chinese.split('').forEach(char => {
        vocabularyChars.add(char);
      });
    });
    
    // For beginner difficulty, allow all chars in vocabulary list plus common connecting words
    if (difficulty === "beginner") {
      console.log("Vocabulary characters:", Array.from(vocabularyChars).join(', '));
      console.log("Common Chinese characters:", commonChineseChars.join(', '));
      // For each character in the sentence, check if it's allowed
      const unknownChars = uniqueSentenceWords.filter(char => 
        !vocabularyChars.has(char) &&                 // Not in vocabulary
        !commonChineseChars.includes(char) &&         // Not a common particle
        char.trim() !== '' &&                         // Not whitespace
        !/\s/.test(char) &&                           // Not whitespace
        !(/[，。！？,.!?]/.test(char))                 // Not punctuation
      );
      
      if (unknownChars.length > 0) {
        console.log(`Beginner sentence has unknown characters: ${unknownChars.join(', ')}`);
        // Only throw error if there are actually unknown characters
        throw new Error("Beginner level sentences must only use vocabulary from the list");
      }
    } 
    // For intermediate/advanced, allow a percentage of non-vocabulary words
    else if (difficulty === "intermediate" || difficulty === "advanced") {
      // Find characters in the sentence that aren't in vocabulary or common chars
      const unknownChars = uniqueSentenceWords.filter(char => 
        !vocabularyChars.has(char) && 
        !commonChineseChars.includes(char) && 
        char.trim() !== '' && 
        !/\s/.test(char) &&
        !(/[，。！？,.!?]/.test(char))
      );
      
      // Allow more unknown characters for higher difficulties
      const maxUnknownRatio = difficulty === "intermediate" ? 0.1 : 0.2; // 10% for intermediate, 20% for advanced
      const unknownRatio = unknownChars.length / uniqueSentenceWords.length;
      
      // Log detailed information for debugging
      console.log(`${difficulty} sentence check: ${unknownChars.length} unknown chars out of ${uniqueSentenceWords.length} total (ratio: ${unknownRatio.toFixed(2)})`);
      if (unknownChars.length > 0) {
        console.log(`Unknown chars: ${unknownChars.join(', ')}`);
      }
      
      // Reject sentences with too many unknown characters
      if (unknownRatio > maxUnknownRatio) {
        throw new Error(`${difficulty} level sentences have too many unknown characters (${unknownRatio.toFixed(2)}). Unknown characters: ${unknownChars.join(', ')}`);
      }
    }
    
    return {
      ...parsedContent,
      difficulty,
      requestedPattern: randomPattern // Include the pattern that was requested
    };
  } catch (error) {
    console.error("Error generating sentence:", error);
    throw new Error(`Failed to generate sentence with error ${error}. Please try again.`);
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
          
          CRITICALLY IMPORTANT: Generate only FACTUALLY CORRECT and LOGICALLY SOUND sentences.
          
          - Family relationships must be logical (e.g., "弟弟" is always male, "姐姐" is always female, etc.)
          - Food items should only be paired with appropriate verbs (eat/drink)
          - People can't be objects or places, and objects can't be people
          - Sentence must make real-world sense and not be nonsensical (e.g., "弟弟不是男姐姐" is illogical)
          - Pronouns should be used correctly (he/she/it)
          
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
          
          IMPORTANT: Use proper grammar particles for tense and aspect:
          - Use the 了 particle to indicate completed actions or change of state (approximately 30% of sentences)
          - Use 过 for past experiences when appropriate
          - Use 正在 or 着 for ongoing actions when appropriate
          
          Examples of proper grammar:
          - "我昨天看了一本书" (I read a book yesterday) - not "我昨天看一本书"
          - "他学了三年中文" (He has studied Chinese for three years) - not "他学三年中文"
          - "我吃了早饭" (I ate breakfast) - not "我吃早饭" when referring to past
          
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
      difficulty,
      requestedPattern: randomPattern // Include the pattern that was requested
    };
  } catch (error) {
    console.error("Error generating sentence:", error);
    throw new Error("Failed to generate example sentence. Please try again.");
  }
}

/**
 * Specifically checks if a sentence translates naturally to English 
 * @param chinese The Chinese sentence to check
 * @returns Object with translation assessment
 */
export async function verifyTranslationQuality(chinese: string): Promise<{
  isNaturalTranslation: boolean;
  naturalEnglishTranslation: string;
  feedback: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are a bilingual Chinese-English translation expert. For the given Chinese sentence, 
          determine if it translates naturally into English.
          
          1. Provide a natural English translation
          2. Assess if the sentence has any Chinese expressions that don't translate well
          3. Pay special attention to verb-object pairs, idioms, and cultural phrases
          
          Examples of problematic sentences:
          - "你的舞跳得不高" - Awkward translation: "Your dancing is not high" - Better: "You don't dance very well"
          - "我们学习明天" - Awkward translation: "We study tomorrow" - Better: "We will study tomorrow"
          
          Return your analysis in JSON format:
          {
            "isNaturalTranslation": boolean,
            "naturalEnglishTranslation": string,
            "feedback": string with explanation if not natural
          }`
        },
        {
          role: "user",
          content: chinese
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    return {
      isNaturalTranslation: result.isNaturalTranslation || false,
      naturalEnglishTranslation: result.naturalEnglishTranslation || "",
      feedback: result.feedback || "No feedback provided"
    };
  } catch (error) {
    console.error("Error checking translation quality:", error);
    // Fallback
    return {
      isNaturalTranslation: true, // Default to true to not block everything on error
      naturalEnglishTranslation: "",
      feedback: "Error checking translation quality"
    };
  }
}