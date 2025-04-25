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
          Provide the sentence in Chinese characters, pinyin (with proper tone marks), and an English translation.
          Important: ONLY use words from the provided vocabulary list. If you need common connecting words like "的" or "是", you may use them ONLY if they're in the vocabulary list.
          Format your response as a valid JSON object with 'chinese', 'pinyin', and 'english' fields.`
        },
        {
          role: "user",
          content: `Vocabulary words (in Chinese): ${chineseWords}. 
          Difficulty level: ${difficulty}.
          Generate a sentence using only these words.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const generatedContent = response.choices[0].message.content;
    if (!generatedContent) {
      throw new Error("No content generated");
    }

    const parsedContent = JSON.parse(generatedContent);
    
    // Validate that the sentence only uses words from the vocabulary
    const sentenceWords = parsedContent.chinese.replace(/[，。！？]/g, '').split('');
    const uniqueSentenceWords = [...new Set(sentenceWords)];
    
    // Check if all words in the sentence are in the vocabulary
    // Note: This is a simple check and may not catch all cases due to word combinations
    const vocabularySet = new Set(vocabulary.map(w => w.chinese).join('').split(''));
    
    const validSentence = uniqueSentenceWords.every(word => 
      vocabularySet.has(word) || word.trim() === '' || /\s/.test(word)
    );

    if (!validSentence) {
      throw new Error("Generated sentence contains words not in vocabulary");
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
