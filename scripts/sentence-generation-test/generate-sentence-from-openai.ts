import { generateSentence, validateSentenceWithAI, verifyTranslationQuality } from "../../server/openai.js";

const WORD_COUNTS = { beginner: 3, intermediate: 5, advanced: 7 };

const COMMON_PARTICLES = [
  { chinese: "的", pinyin: "de", english: "possessive particle" },
  { chinese: "了", pinyin: "le", english: "completion particle" },
  { chinese: "是", pinyin: "shì", english: "to be" },
  { chinese: "在", pinyin: "zài", english: "at, in" },
  { chinese: "和", pinyin: "hé", english: "and" },
  { chinese: "吗", pinyin: "ma", english: "question particle" }
];

const FALLBACK_SENTENCES = {
  beginner: [{ chinese: "我很高兴。", pinyin: "Wǒ hěn gāoxìng.", english: "I am very happy." }],
  intermediate: [{ chinese: "这本书很有意思。", pinyin: "Zhè běn shū hěn yǒuyìsi.", english: "This book is very interesting." }],
  advanced: [{ chinese: "我已经学了三年中文了。", pinyin: "Wǒ yǐjīng xué le sān nián Zhōngwén le.", english: "I have been learning Chinese for three years." }]
};

async function generateAndValidateSentence(difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner') {
  console.log(`\n--- Generating ${difficulty} sentence ---`);
  
  const MOCK_VOCABULARY = [
    { id: 1, chinese: "学习", pinyin: "xuéxí", english: "to study", active: true, lessonId: 1 },
    { id: 2, chinese: "中文", pinyin: "Zhōngwén", english: "Chinese language", active: true, lessonId: 1 },
    { id: 3, chinese: "喜欢", pinyin: "xǐhuān", english: "to like", active: true, lessonId: 2 },
    { id: 4, chinese: "饭", pinyin: "fàn", english: "meal, cooked rice", active: true, lessonId: 3 },
    { id: 5, chinese: "吃", pinyin: "chī", english: "to eat", active: true, lessonId: 3 },
    { id: 6, chinese: "水", pinyin: "shuǐ", english: "water", active: true, lessonId: 4 },
    { id: 7, chinese: "喝", pinyin: "hē", english: "to drink", active: true, lessonId: 4 },
    { id: 8, chinese: "去", pinyin: "qù", english: "to go", active: true, lessonId: 5 },
    { id: 9, chinese: "学校", pinyin: "xuéxiào", english: "school", active: true, lessonId: 5 },
  ];

  // Simplified word selection logic for testing
  const selectWords = (
    words: Array<{ id: number; lessonId?: number | null; chinese: string; pinyin: string; english: string }>,
    count: number
  ) => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, words.length));
  };

  try {
    // 1. Get user vocabulary (using mock data)
    const activeVocab = MOCK_VOCABULARY.filter(word => word.active);
    
    if (activeVocab.length === 0) {
      console.log("No vocabulary available");
      return useFallback(difficulty, "No vocabulary");
    }
    
    console.log(`Using ${activeVocab.length} vocabulary words`);
    
    // 2. Select words for generation
    const selectedWords = selectWords(activeVocab, WORD_COUNTS[difficulty]);
    console.log(`Selected: ${selectedWords.map(w => w.chinese).join(', ')}`);
    
    // 3. Generate sentence with common particles
    let sentence;
    if (selectedWords.length >= 2) {
      const existingChars = new Set(selectedWords.flatMap(w => w.chinese.split('')));
      const additionalWords = COMMON_PARTICLES.filter(w => !existingChars.has(w.chinese));
      const enhancedVocab = [...selectedWords, ...additionalWords];
      
      try {
        sentence = await generateSentence(enhancedVocab, difficulty, true);
      } catch (error) {
        console.log("Enhanced generation failed, using basic mode");
        sentence = await generateSentence(selectedWords, difficulty);
      }
    } else {
      sentence = await generateSentence(selectedWords, difficulty);
    }
    
    console.log(`Generated: "${sentence.chinese}"`);
    
    // 4. Validate sentence
    const isValid = await validateGeneratedSentence(sentence, difficulty);
    
    if (isValid) {
      console.log("\n--- Valid Sentence ---");
      console.log(`Chinese: ${sentence.chinese}`);
      console.log(`Pinyin: ${sentence.pinyin}`);
      console.log(`English: ${sentence.english}`);
      return sentence;
    } else {
      return createFallback(selectedWords, difficulty, sentence.chinese);
    }
    
  } catch (error) {
    console.error("Generation error:", error);
    return useFallback(difficulty, `Error: ${error}`);
  }
}

async function validateGeneratedSentence(sentence: any, difficulty: string): Promise<boolean> {
  // AI validation
  try {
    const aiResult = await validateSentenceWithAI(sentence.chinese, difficulty);
    console.log(`AI validation: Score=${aiResult.score}, Valid=${aiResult.isValid}`);
    
    if (aiResult.score < 7) {
      if (aiResult.corrections) {
        sentence.chinese = aiResult.corrections;
        console.log(`Applied correction: "${sentence.chinese}"`);
      } else {
        console.log("Score too low, no corrections available");
        return false;
      }
    }
    
    if (!aiResult.isValid) {
      console.log(`AI rejected: ${aiResult.feedback}`);
      return false;
    }
  } catch (error) {
    console.error("AI validation failed:", error);
    if (sentence.chinese.length > 8) {
      return false;
    }
  }
  
  // Translation quality check
  try {
    const translationCheck = await verifyTranslationQuality(sentence.chinese);
    if (!translationCheck.isNaturalTranslation) {
      console.log(`Translation quality issue: ${translationCheck.feedback}`);
      return false;
    }
    if (translationCheck.naturalEnglishTranslation) {
      sentence.english = translationCheck.naturalEnglishTranslation;
    }
  } catch (error) {
    console.error("Translation check failed:", error);
  }
  
  return true;
}

function createFallback(selectedWords: any[], difficulty: string, rejectedSentence: string) {
  console.log("\n--- Using Fallback ---");
  const randomWord = selectedWords[Math.floor(Math.random() * selectedWords.length)];
  const fallback = {
    chinese: `我们学习${randomWord.chinese}。`,
    pinyin: `Wǒmen xuéxí ${randomWord.pinyin}.`,
    english: `We are studying ${randomWord.english}.`,
    difficulty,
    fromFallback: true,
    rejectedOriginal: rejectedSentence
  };
  
  console.log(`Chinese: ${fallback.chinese}`);
  console.log(`Pinyin: ${fallback.pinyin}`);
  console.log(`English: ${fallback.english}`);
  return fallback;
}

function useFallback(difficulty: string, reason: string) {
  console.log(`\n--- General Fallback (${reason}) ---`);
  const fallbacks = FALLBACK_SENTENCES[difficulty as keyof typeof FALLBACK_SENTENCES] || FALLBACK_SENTENCES.beginner;
  const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  
  console.log(`Chinese: ${fallback.chinese}`);
  console.log(`Pinyin: ${fallback.pinyin}`);
  console.log(`English: ${fallback.english}`);
  return { ...fallback, difficulty, fromFallback: true };
}

const args = process.argv.slice(2);
const difficulty = (args[0] as 'beginner' | 'intermediate' | 'advanced') || 'beginner';

generateAndValidateSentence(difficulty)
  .then(result => {
    console.log("\n--- Generation Complete ---");
  })
  .catch(err => {
    console.error("Script failed:", err);
  });
