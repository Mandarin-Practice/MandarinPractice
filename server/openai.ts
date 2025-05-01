import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "your-api-key" });

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

  const difficultyGuide = {
    beginner: "Use simple sentence structures with basic subject-verb patterns. Include 3-5 words.",
    intermediate: "Use more complex grammar with some compounds and basic conjunctions. Include 5-8 words.",
    advanced: "Use sophisticated grammar and sentence structures. Include 8-10 words or more."
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Mandarin Chinese language teacher creating practice sentences for students.
          Generate a grammatically correct Mandarin sentence using ONLY the vocabulary words provided.
          ${difficultyGuide[difficulty]}
          
          Use varied sentence structures, such as:
          - Questions (using 吗, 呢, 吧)
          - Imperative statements
          - Comparison sentences
          - If/then structures
          - Opinion statements
          - Time-based sentences
          - Descriptive sentences
          - Cause and effect relationships
          
          Avoid generating similar sentence patterns repeatedly. Try to introduce variety.
          Provide the sentence in Chinese characters, pinyin (with proper tone marks), and an English translation.
          Important: ONLY use words from the provided vocabulary list. If you need common connecting words like "的" or "是", you may use them ONLY if they're in the vocabulary list.
          Format your response as a valid JSON object with 'chinese', 'pinyin', and 'english' fields.`
        },
        {
          role: "user",
          content: `Vocabulary words (in Chinese): ${chineseWords}. 
          Difficulty level: ${difficulty}.
          Generate a sentence using only these words. Make sure to use a different sentence structure than recently generated sentences. Be creative with the structure.`
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

  const difficultyGuide = {
    beginner: "Use simple sentence structures with basic subject-verb patterns. Include 3-5 words.",
    intermediate: "Use more complex grammar with some compounds and basic conjunctions. Include 5-8 words.",
    advanced: "Use sophisticated grammar and sentence structures. Include 8-10 words or more."
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Mandarin Chinese language teacher creating example sentences. 
          Generate a grammatically correct Mandarin sentence that includes the word "${word}".
          ${difficultyGuide[difficulty]}
          
          Use varied sentence structures, such as:
          - Questions (using 吗, 呢, 吧)
          - Imperative statements
          - Comparison sentences
          - If/then structures
          - Opinion statements
          - Time-based sentences
          - Descriptive sentences
          - Cause and effect relationships
          
          Avoid generating similar sentence patterns repeatedly. Try to introduce variety.
          Provide the sentence in Chinese characters, pinyin (with proper tone marks), and an English translation.
          Format your response as a valid JSON object with 'chinese', 'pinyin', and 'english' fields.`
        },
        {
          role: "user",
          content: `Create a natural, grammatically correct sentence in Mandarin that includes the word "${word}".
          Difficulty level: ${difficulty}.
          Make sure to use a different sentence structure than what might be typically generated. Be creative with the grammatical structure while maintaining natural Chinese expression.`
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
