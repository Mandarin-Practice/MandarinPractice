import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { characterSchema, characterDefinitionSchema, FullProficiency, Proficiency } from "@shared/schema";
import { ZodError } from "zod";
import { generateSentence, generateSentenceWithWord, checkSynonyms, validateSentenceWithAI, verifyTranslationQuality } from "./openai";
import dictionaryAdminRoutes from "./routes/dictionary-admin";
import authRoutes from "./routes/auth";
import { firebaseAuth } from "./middleware/auth";
import { verifyFirebaseToken } from "./middleware/auth";

// List of unnatural or grammatically incorrect sentence patterns to filter out
const unnaturalPatterns = [
  // Greetings related patterns
  { pattern: "请你好", reason: "Incorrect greeting structure" },
  { pattern: "谢谢你好", reason: "Incorrect greeting combination" },
  { pattern: "谢谢好", reason: "Incorrect greeting structure" },
  { pattern: "吗你好", reason: "Incorrect particle usage with greeting" },
  { pattern: "呢你好", reason: "Incorrect particle usage with greeting" },
  { pattern: "吧你好", reason: "Incorrect particle usage with greeting" },

  // Verb structure problems
  { pattern: "我是去", reason: "Incorrect verb structure" },
  { pattern: "他是看", reason: "Incorrect verb structure" },
  { pattern: "你是来", reason: "Incorrect verb structure" },

  // Particle errors
  { pattern: "你吧好", reason: "Incorrect particle usage" },
  { pattern: "你好吧", reason: "Incorrect particle usage" },
  { pattern: "你呢好", reason: "Incorrect particle usage" },
  { pattern: "你吗好", reason: "Incorrect particle usage" },

  // Conjunction errors
  { pattern: "所以。", reason: "Incomplete sentence ending with conjunction" },
  { pattern: "因为。", reason: "Incomplete sentence ending with conjunction" },

  // Double greeting patterns
  { pattern: "你好你好", reason: "Redundant greeting" },
  { pattern: "早上早上", reason: "Redundant greeting" },
  { pattern: "晚上晚上", reason: "Redundant time reference" },

  // Pronoun/verb ordering
  { pattern: "请我", reason: "Incorrect pronoun-verb ordering" },
  { pattern: "请他们", reason: "Incorrect pronoun-verb ordering" }
];

// Function to validate if a sentence is natural and grammatically correct
function validateSentence(chinese: string): { isValid: boolean; reason?: string } {
  // Check against known unnatural patterns
  for (const { pattern, reason } of unnaturalPatterns) {
    if (chinese.includes(pattern)) {
      return { isValid: false, reason };
    }
  }

  // Check for redundant/incorrect pronoun+verb patterns
  if (/你请/.test(chinese)) {
    return { isValid: false, reason: "Incorrect pronoun-verb combination" };
  }

  // Check for sentences that are too short (likely to be unnatural)
  if (chinese.replace(/[,.?!，。？！]/g, '').length < 3) {
    return { isValid: false, reason: "Sentence is too short" };
  }

  // Check for adjacent duplicated characters (likely errors)
  const duplicateChars = /(.)\1{2,}/.exec(chinese);
  if (duplicateChars) {
    return { isValid: false, reason: `Repeated character: ${duplicateChars[1]}` };
  }

  // Check for incorrect particle usage at the end of sentences
  if (chinese.endsWith('的。') || chinese.endsWith('的?') || chinese.endsWith('的？')) {
    return { isValid: false, reason: "Incorrect particle usage at sentence end" };
  }

  // Check for incorrect sentence structure with names
  if (/李友李/.test(chinese) || /王朋王/.test(chinese)) {
    return { isValid: false, reason: "Incorrect name structure (missing separator)" };
  }

  // Check for incomplete conjunction usage
  const conjunctions = ['所以', '因为', '但是', '虽然'];
  for (const conjunction of conjunctions) {
    // Check if the conjunction is at the end of the sentence (right before punctuation)
    if (chinese.endsWith(conjunction + '。') ||
        chinese.endsWith(conjunction + '？') ||
        chinese.endsWith(conjunction + '！')) {
      return { isValid: false, reason: `Incomplete sentence ending with conjunction "${conjunction}"` };
    }

    // Check if the conjunction is alone in a very short sentence
    if (chinese.replace(/[,.?!，。？！]/g, '').length < 6 &&
        chinese.includes(conjunction)) {
      return { isValid: false, reason: `Sentence too short for conjunction "${conjunction}"` };
    }
  }

  // Check for inappropriate subject-verb-object combinations
  // 学习 (study) should be followed by something learnable (a language, subject, skill)
  const nonLearnableObjects = ['像', '蛋糕', '衣服', '鞋子', '筷子', '汤', '水', '菜', '饭'];
  for (const obj of nonLearnableObjects) {
    if (chinese.includes('学习' + obj)) {
      return { isValid: false, reason: `Inappropriate object for 学习 (study): ${obj}` };
    }
  }

  // Check for other inappropriate verb-object pairs
  if (chinese.includes('吃水') || chinese.includes('喝饭') ||
      chinese.includes('看音乐') || chinese.includes('听电影')) {
    return { isValid: false, reason: "Inappropriate verb-object combination" };
  }

  // Check for treating non-food items as food
  const foodVerbs = ['吃', '喝'];
  const nonFoodItems = ['书', '桌子', '椅子', '手机', '电脑', '衣服'];

  for (const verb of foodVerbs) {
    for (const item of nonFoodItems) {
      if (chinese.includes(verb + item)) {
        return { isValid: false, reason: `Inappropriate verb-object combination: ${verb}${item}` };
      }
    }
  }

  return { isValid: true };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user's vocabulary words (requires authentication)
  app.get("/api/vocabulary/words", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const vocabulary = await storage.getAllVocabulary(userId);

      if (!Array.isArray(vocabulary)) {
        return res.status(400).json({ message: "Failed to fetch all vocab with userId: " + userId });
      }

      res.json(vocabulary);
    } catch (error) {
      console.log("Failed to fetch vocabulary with error" + error);
      res.status(500).json({ message: "Failed to fetch vocabulary with error" + error});
    }
  });

  // Add vocabulary words
  app.post("/api/vocabulary/words", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const { words } = req.body;

      if (!Array.isArray(words)) {
        return res.status(400).json({ message: "Words must be an array" });
      }

      const savedWords = await storage.addVocabularyBatch(userId, words);

      res.status(201).json(savedWords);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to add vocabulary" });
    }
  });

  app.post("/api/vocabulary/words/import", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const words = req.body.words;

      if (!Array.isArray(words)) {
        return res.status(400).json({ message: "Words must be an array" });
      }

      // Add the word to the vocabulary
      const savedWord = await storage.addVocabularyBatch(userId, words);

      res.status(201).json(savedWord);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to import vocabulary" });
    }
  });

  // Update a vocabulary word
  app.patch("/api/vocabulary/words/:id", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const updates = req.body;
      const updatedWord = await storage.updateVocabulary(userId, id, updates);
      res.status(200).json(updatedWord);
    } catch (error) {
      res.status(404).json({ message: error instanceof Error ? error.message : "Vocabulary not found" });
    }
  });

  // Delete a vocabulary word
  app.delete("/api/vocabulary/words/by-chinese", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const word = req.body;

      if (!word) {
        return res.status(400).json({ message: "Invalid word format" });
      }

      await storage.deleteVocabularyByChinese(userId, word.chinese);
      res.status(200).json({ message: "Vocabulary deleted" });
    } catch (error) {
      res.status(404).json({ message: "Vocabulary not found" });
    }
  });

  // Delete a vocabulary word using chinese and pinyin
  app.delete("/api/vocabulary/words/:id", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      await storage.deleteVocabulary(userId, id);
      res.status(200).json({ message: "Vocabulary deleted" });
    } catch (error) {
      res.status(404).json({ message: "Vocabulary not found" });
    }
  });

  // Delete all vocabulary words
  app.delete("/api/vocabulary/words", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      await storage.deleteAllVocabulary(userId);
      res.status(200).json({ message: "All vocabulary deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vocabulary" });
    }
  });

  // Get a specific vocabulary word by ID
  app.get("/api/vocabulary/words/:id", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const word = await storage.getVocabulary(userId, id);

      if (!word) {
        return res.status(404).json({ message: "Vocabulary not found" });
      }

      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  // Get a specific vocabulary word by ID
  app.get("/api/vocabulary/words/:id", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    console.log("\n\nGETTING SPECIFIC VOCAB WORD\n\n")
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const word = await storage.getVocabulary(userId, id);

      if (!word) {
        return res.status(404).json({ message: "Vocabulary not found" });
      }

      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  app.get("/api/vocabulary/words/id-batch", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    console.log("\n\nGETTING VOCAB WORDS BY ID BATCH\n\n")
    try {
      const userId = req.authenticatedUserId;
      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const paramIds = req.query.wordIds;

      if (!paramIds || !Array.isArray(paramIds)) {
        return res.status(400).json({ message: "Invalid or missing IDs" });
      }

      let ids: string[];
      if (Array.isArray(paramIds)) {
        ids = paramIds.map(id => String(id));
      } else {
        // Handle comma-separated string case
        ids = String(paramIds).split(',');
      }

      const wordIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (wordIds.length === 0) {
        return res.status(400).json({ message: "No valid IDs provided" });
      }
      const words = await storage.getVocabularyBatch(userId, wordIds);
      if (!words || words.length === 0) {
        return res.status(404).json({ message: "No vocabulary found for the provided IDs" });
      }
      res.json(words);
    } catch (error) {
      console.error("Error fetching vocabulary by ID batch:", error);
      res.status(500).json({ message: "Failed to fetch vocabulary by ID batch" });
    }
  });

  app.post("/api/vocabulary/words/get-chinese-batch", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    console.log("\n\nGETTING VOCAB WORDS BY CHINESE BATCH\n\n")
    try {
      const userId = req.authenticatedUserId;
      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const wordRequest = req.body.words as string[];

      if (!wordRequest || !Array.isArray(wordRequest)) {
        return res.status(400).json({ message: "Invalid or missing entries" });
      }

      if (wordRequest.length === 0) {
        return res.status(400).json({ message: "No valid entries provided" });
      }

      const words = await storage.getVocabularyBatchByChinese(userId, wordRequest);
      if (!words || words.length === 0) {
        return res.status(404).json({ message: "No vocabulary found for the provided entries" });
      }
      res.json(words);
    } catch (error) {
      console.error("Error retrieving vocabulary batch:", error);
      res.status(500).json({ message: "Failed to retrieve vocabulary" });
    }
  });

  // Create a sentence cache to speed up responses
  const sentenceCache = {
    beginner: [] as any[],
    intermediate: [] as any[],
    advanced: [] as any[],
    lastUpdated: Date.now(),
    maxSize: 10, // Store 10 sentences per difficulty level
    expiryTimeMs: 60 * 60 * 1000 // Cache expires after 1 hour
  };

  // Track word usage to ensure all words get used in practice
  const wordUsageStats: Record<number, { uses: number, lastUsed: number }> = {};

  // Background cache filler function - runs in the background to keep the cache filled
  async function fillSentenceCache() {
    try {
      // Try to get vocabulary from user accounts first
      const users = await storage.getAllUsers();
      let userVocabulary: FullProficiency[] = [];

      // If we have users, try to use their vocabulary for more relevant sentences
      if (users && users.length > 0) {
        // Get a random user's word list
        const randomUser = users[Math.floor(Math.random() * users.length)];
        try {
          const allUserWords = await storage.getAllVocabularyWithProficiency(randomUser.id);

          // Filter out undefined entries and inactive words
          userVocabulary = allUserWords.filter(word => word.active);
        } catch (error) {
          console.error("Error fetching sample user vocabulary:", error);
        }
      }

      if (userVocabulary.length === 0) return; // Nothing to cache if no vocabulary

      // Function to select words, prioritizing newer lesson words and less frequently used words
      const selectWords = (wordsList: Array<{ id: number, lessonId?: number | null, chinese: string, pinyin: string, english: string}>, count: number) => {
        // Ensure we don't try to select more words than available
        const selectionCount = Math.min(count, wordsList.length);

        // Identify advanced lesson words (from lessons 11-20)
        const advancedLessonWords = wordsList.filter(word =>
          word.lessonId && word.lessonId >= 11 && word.lessonId <= 20
        );

        // Always try to include at least one advanced lesson word if available
        let selectedWords: typeof wordsList = [];

        if (advancedLessonWords.length > 0 && count > 1) {
          // Ensure a minimum percentage of words from newer lessons
          const minAdvancedWords = Math.max(1, Math.floor(count * 0.5)); // At least 50% of words from newer lessons
          const maxAdvancedWords = Math.min(advancedLessonWords.length, Math.ceil(count * 0.8)); // At most 80% of words

          // Randomly select advanced lesson words
          const shuffledAdvanced = [...advancedLessonWords].sort(() => 0.5 - Math.random());
          const selectedAdvanced = shuffledAdvanced.slice(0, maxAdvancedWords);

          // Add to selected words
          selectedWords = selectedAdvanced;

          // Remove selected advanced words from wordsList to avoid duplicates
          const selectedIds = new Set(selectedWords.map(w => w.id));
          const remainingWords = wordsList.filter(w => !selectedIds.has(w.id));

          // Fill remaining slots based on usage weight
          const remainingCount = count - selectedWords.length;
          if (remainingCount > 0 && remainingWords.length > 0) {
            // Create a weighted list based on usage
            const weightedWords = remainingWords.map(word => {
              const stats = wordUsageStats[word.id] || { uses: 0, lastUsed: 0 };
              // Lower score = higher priority for selection
              // Weight by number of uses and how recently the word was used
              const recencyFactor = Math.max(0, (Date.now() - stats.lastUsed) / (1000 * 60 * 60)); // hours since last use
              const usageFactor = stats.uses + 1; // +1 to avoid division by zero
              // Unused words get highest priority (score of 0)
              const score = (stats.uses === 0) ? 0 : usageFactor / (recencyFactor + 0.1);

              return {
                word,
                score
              };
            });

            // Sort by score (lower = higher priority)
            weightedWords.sort((a, b) => a.score - b.score);

            // Take the top N remaining words
            const remainingSelected = weightedWords.slice(0, remainingCount).map(item => item.word);
            selectedWords = [...selectedWords, ...remainingSelected];
          }
        } else {
          // Fall back to original selection algorithm if no advanced lesson words available
          // Create a weighted list based on usage
          const scrambledWords = [...wordsList] /* method that creates an array of references to the words in wordsList*/
          scrambledWords.sort(() => 0.5 - Math.random()); // Shuffle the words randomly
          const weightedWords = scrambledWords.map(word => {
            const stats = wordUsageStats[word.id] || { uses: 0, lastUsed: 0 };
            // Lower score = higher priority for selection
            // Weight by number of uses and how recently the word was used
            const recencyFactor = Math.max(0, (Date.now() - stats.lastUsed) / (1000 * 60 * 60)); // hours since last use
            const usageFactor = stats.uses + 1; // +1 to avoid division by zero
            // Unused words get highest priority (score of 0)
            const score = (stats.uses === 0) ? 0 : usageFactor / (recencyFactor + 0.1);

            // Add a bonus for higher lesson IDs to prioritize newer vocabulary
            const lessonBonus = word.lessonId ? Math.min(5, word.lessonId / 2) : 0;
            const adjustedScore = score - lessonBonus;

            return {
              word,
              score: adjustedScore
            };
          });

          // Sort by score (lower = higher priority)
          weightedWords.sort((a, b) => a.score - b.score);

          // Take the top N words
          selectedWords = weightedWords.slice(0, selectionCount).map(item => item.word);
        }

        return selectedWords;
      };

      // Fill cache for each difficulty if needed
      for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
        // Only fill if we need more sentences
        if (sentenceCache[difficulty].length < sentenceCache.maxSize) {
          try {
            // Select a subset of vocabulary words, prioritizing less used words
            const selectedWords = selectWords(
              userVocabulary,
              10
            );

            // Add common grammatical particles if they aren't already in the vocabulary
            // This helps create more natural sentences while still focusing on the target vocabulary
            const commonWords = [
              { chinese: "的", pinyin: "de", english: "possessive particle" },
              { chinese: "了", pinyin: "le", english: "completion particle" },
              { chinese: "是", pinyin: "shì", english: "to be" },
              { chinese: "在", pinyin: "zài", english: "at, in" },
              { chinese: "和", pinyin: "hé", english: "and" },
              { chinese: "吗", pinyin: "ma", english: "question particle" }
            ];

            // Only add common words if there are enough vocabulary words
            // For beginner level, ensure we have at least 3 actual vocabulary words
            let sentence;
            if (selectedWords.length >= (difficulty === "beginner" ? 3 : 2)) {
              // Filter out common words that are already in vocabulary
              const existingChars = new Set(selectedWords.flatMap(w => w.chinese.split('')));
              const additionalWords = commonWords.filter(w => !existingChars.has(w.chinese));

              // Add common words as supplementary vocabulary
              const enhancedVocabulary = [...selectedWords, ...additionalWords];

              try {
                // Try generating with enhanced vocabulary first
                sentence = await generateSentence(selectedWords, difficulty, true);
              } catch (err) {
                const error = err as Error;
                console.error("Couldn't generate with enhanced vocabulary, falling back to strict mode:", error.message);
                // Fall back to strict mode with only the original vocabulary
                sentence = await generateSentence(selectedWords, difficulty);
              }
            } else {
              // Not enough words for enhancement, use strict mode
              sentence = await generateSentence(selectedWords, difficulty);
            }

            // Update word usage statistics
            selectedWords.forEach(word => {
              if (!wordUsageStats[word.id]) {
                wordUsageStats[word.id] = { uses: 0, lastUsed: 0 };
              }
              wordUsageStats[word.id].uses += 1;
              wordUsageStats[word.id].lastUsed = Date.now();
            });

            // Validate sentence naturalness before adding to cache
            const validationResult = validateSentence(sentence.chinese);

            // Only add natural and grammatically correct sentences to the cache
            if (validationResult.isValid) {
              // Check for duplicates
              const isDuplicate = sentenceCache[difficulty].some(s => s.chinese === sentence.chinese);
              if (!isDuplicate) {
                sentenceCache[difficulty].push({
                  ...sentence,
                  difficulty,
                  createdAt: Date.now(),
                  usedWords: selectedWords.map(w => w.id) // Track which words were used
                });
              }
            } else {
              console.log(`Rejected unnatural sentence: "${sentence.chinese}" - Reason: ${validationResult.reason}`);
            }
          } catch (error) {
            console.error(`Error filling cache for ${difficulty}:`, error);
          }
        }
      }

      // Update the last updated timestamp
      sentenceCache.lastUpdated = Date.now();
    } catch (error) {
      console.error("Error filling sentence cache:", error);
    }
  }

  // Start filling the cache on server start (after a short delay)
  setTimeout(() => {
    fillSentenceCache();

    // Set up periodic cache filling every 30 minutes
    setInterval(fillSentenceCache, 30 * 60 * 1000);
  }, 5000);

  // Generate a sentence using the user's vocabulary
  app.post("/api/sentence/generate", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const { difficulty = "beginner" } = req.body;
      const typedDifficulty = difficulty as 'beginner' | 'intermediate' | 'advanced';

      // Helper function to select words, prioritizing less frequently used words
      const selectWords = (wordsList: Array<{ id: number, lessonId?: number | null, chinese: string, pinyin: string, english: string}>, count: number) => {
        // Ensure we don't try to select more words than available
        const selectionCount = Math.min(count, wordsList.length);
        const scrambledWords = [...wordsList] /* method that creates an array of references to the words in wordsList*/
        scrambledWords.sort(() => 0.5 - Math.random()); // Shuffle the words randomly
        // Create a weighted list based on usage
        const weightedWords = scrambledWords.map(word => {
          const stats = wordUsageStats[word.id] || { uses: 0, lastUsed: 0 };
          // Lower score = higher priority for selection
          // Weight by number of uses and how recently the word was used
          const recencyFactor = Math.max(0, (Date.now() - stats.lastUsed) / (1000 * 60 * 60)); // hours since last use
          const usageFactor = stats.uses + 1; // +1 to avoid division by zero
          // Unused words get highest priority (score of 0)
          const score = (stats.uses === 0) ? 0 : usageFactor / (recencyFactor + 0.1);

          return {
            word,
            score
          };
        });

        // Sort by score (lower = higher priority)
        weightedWords.sort((a, b) => a.score - b.score);

        // Take the top N words
        return weightedWords.slice(0, selectionCount).map(item => item.word);
      };

      // Check if cache is expired
      const cacheIsExpired = (Date.now() - sentenceCache.lastUpdated) > sentenceCache.expiryTimeMs;

      // Try to get a sentence from the cache first
      if (!cacheIsExpired && sentenceCache[typedDifficulty].length > 0) {
        // Get a random cached sentence
        const randomIndex = Math.floor(Math.random() * sentenceCache[typedDifficulty].length);
        const cachedSentence = sentenceCache[typedDifficulty][randomIndex];

        // Remove the used sentence from cache to prevent repetition
        sentenceCache[typedDifficulty].splice(randomIndex, 1);

        // Start refilling the cache in the background
        setTimeout(fillSentenceCache, 100);

        // Return the cached sentence with a flag indicating it's from cache
        return res.json({
          ...cachedSentence,
          fromCache: true
        });
      }

      // If we reach here, there's no cache or we need a new sentence

      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      let userVocabulary: FullProficiency[] = [];

      try {
        const allUserWords = await storage.getAllVocabularyWithProficiency(userId);

        // Filter out undefined entries and inactive words
        userVocabulary = allUserWords
          .filter(word => word && word.active);

      } catch (error) {
        console.error("Error fetching user vocabulary:", error);
      }

      // Final check if we have any vocabulary
      if (userVocabulary.length === 0) {
        console.log("No active vocabulary words available. Please add or activate some words first.");
      }

      // Generate new sentence using OpenAI with retries
      try {
        // Select a subset of vocabulary words, prioritizing less used words
        const selectedWords = selectWords(
          userVocabulary,
          10
        );

        // Add common grammatical particles for more natural sentences
        const commonWords = [
          { chinese: "的", pinyin: "de", english: "possessive particle" },
          { chinese: "了", pinyin: "le", english: "completion particle" },
          { chinese: "是", pinyin: "shì", english: "to be" },
          { chinese: "在", pinyin: "zài", english: "at, in" },
          { chinese: "和", pinyin: "hé", english: "and" },
          { chinese: "吗", pinyin: "ma", english: "question particle" }
        ];

        // Only add common words if there are enough vocabulary words
        let sentence;
        if (selectedWords.length >= (typedDifficulty === "beginner" ? 3 : 2)) {
          // Filter out common words that are already in vocabulary
          const existingChars = new Set(selectedWords.flatMap(w => w.chinese.split('')));
          const additionalWords = commonWords.filter(w => !existingChars.has(w.chinese));

          // Add common words as supplementary vocabulary
          const enhancedVocabulary = [...selectedWords, ...additionalWords];

          try {
            // Try generating with enhanced vocabulary first
            sentence = await generateSentence(selectedWords, typedDifficulty, true);
          } catch (err) {
            const error = err as Error;
            console.error("Couldn't generate with enhanced vocabulary, falling back to strict mode:", error.message);
            // Fall back to strict mode with only the original vocabulary
            sentence = await generateSentence(selectedWords, typedDifficulty);
          }
        } else {
          // Not enough words for enhancement, use strict mode
          sentence = await generateSentence(selectedWords, typedDifficulty);
        }

        // Update word usage statistics
        selectedWords.forEach(word => {
          if (!wordUsageStats[word.id]) {
            wordUsageStats[word.id] = { uses: 0, lastUsed: 0 };
          }
          wordUsageStats[word.id].uses += 1;
          wordUsageStats[word.id].lastUsed = Date.now();
        });

        let aiValidationResult: {
          isValid: boolean;
          score: number;
          feedback: string;
          corrections?: string;
          translationPreview?: string;
        } = {
          isValid: false,
          score: 0,
          feedback: "NO VALIDATION PERFORMED",
          corrections: "",
          translationPreview: ""
        }

        try {
          console.log("Running AI validation for sentence:", sentence.chinese);
          aiValidationResult = await validateSentenceWithAI(sentence.chinese, typedDifficulty);

          // Log AI validation results
          console.log(`AI validation results: Score=${aiValidationResult.score}, Valid=${aiValidationResult.isValid}`);
          console.log(`AI feedback: ${aiValidationResult.feedback}`);

          // If score is below 7, the sentence is not good enough
          if (aiValidationResult.score < 7) {
            if (aiValidationResult.corrections) {
              console.log(`Suggested corrections: ${aiValidationResult.corrections}. Original sentence: ${sentence.chinese}`);

              console.log("Applying AI-suggested corrections to improve sentence quality");
              sentence.chinese = aiValidationResult.corrections;

              aiValidationResult.isValid = true;
            } else {
              console.log("No corrections suggested by AI, but score is below 7");
              // No corrections available and score below 7, reject
              aiValidationResult.isValid = false;
            }
          }
        } catch (aiError) {
          // If AI validation errors, we're more cautious - only accept very simple sentences
          console.error("AI validation error:", aiError);
          if (sentence.chinese.length > 8) {
            console.log("Rejecting longer sentence due to failed AI validation");
            aiValidationResult.isValid = false;
            aiValidationResult.feedback = "AI validation error - cannot verify semantic correctness";
          } else {
            console.log("Continuing with very simple pattern-validated sentence despite AI validation error");
          }
        }

        // Additional step: Even if validation passed, double-check the translation quality
        if (aiValidationResult.isValid) {
          try {
            console.log("Verifying translation quality for:", sentence.chinese);
            const translationCheck = await verifyTranslationQuality(sentence.chinese);

            if (!translationCheck.isNaturalTranslation) {
              console.log(`Translation quality check failed: "${sentence.chinese}"`);
              console.log(`Feedback: ${translationCheck.feedback}`);
              console.log(`Better translation would be: ${translationCheck.naturalEnglishTranslation}`);

              // If there's a translation issue, reject the sentence
              // aiValidationResult.isValid = false;
              // aiValidationResult.feedback = `Poor translation quality: ${translationCheck.feedback}`;

              // Update the English translation with the improved version for future use
              if (translationCheck.naturalEnglishTranslation) {
                sentence.english = translationCheck.naturalEnglishTranslation;
              }
            } else {
              console.log("Translation quality check passed");
              // If there's a better translation available, use it
              if (translationCheck.naturalEnglishTranslation) {
                sentence.english = translationCheck.naturalEnglishTranslation;
              }
            }
          } catch (translationError) {
            console.error("Translation quality check error:", translationError);
            // Continue with the sentence - don't block if this additional check fails
          }
        }

        if (aiValidationResult.isValid) {
          // Add to cache for future use - only if it passed both validations
          if (sentenceCache[typedDifficulty].length < sentenceCache.maxSize) {
            sentenceCache[typedDifficulty].push({
              ...sentence,
              difficulty: typedDifficulty,
              createdAt: Date.now(),
              usedWords: selectedWords.map(w => w.id) // Track which words were used
            });
          }

          // Send the validated sentence to the client
          res.json(sentence);
        } else {
          console.log(`Rejected sentence: "${sentence.chinese}" - Reason: ${aiValidationResult.feedback}`);
        }
      } catch (generateError) {
        console.log("Error generating sentence with OpenAI. Error: " + generateError);
        throw new Error("Sentence generation failed with error: " + generateError);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate sentence" });
    }
  });

  // Generate a sentence using a specific word
  app.post("/api/sentence/generate/word", async (req, res) => {
    try {
      const { word, difficulty = "beginner" } = req.body;

      if (!word) {
        return res.status(400).json({ message: "Word is required" });
      }

      // Generate sentence using OpenAI with specific word
      try {
        const sentence = await generateSentenceWithWord(word, difficulty);

        // Validate sentence naturalness
        const validationResult = validateSentence(sentence.chinese);

        if (validationResult.isValid) {
          res.json(sentence);
        } else {
          console.log(`Rejected unnatural word-specific sentence: "${sentence.chinese}" - Reason: ${validationResult.reason}`);
        }
      } catch (generateError) {
        console.log(`Error generating sentence with word "${word}"`);
        throw new Error(`Error generating sentence with word "${word}"`)
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate sentence" });
    }
  });

  // Get proficiency for a specific word
  app.get("/api/vocabulary/proficiency/:wordId", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const wordId = parseInt(req.params.wordId); // Before: const wordId = req.body.wordId;

      if (isNaN(wordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const proficiency = await storage.getWordProficiency(userId, wordId);

      if (!proficiency) {
        console.error("No proficiency found for word ID:", wordId);
        return res.status(400).json({ message: `Failed to fetch proficiency ${wordId} with userId: ${userId}` });
      }

      res.json({
        proficiency
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get word proficiency" });
    }
  });

  // Update word proficiency batch
  app.post("/api/vocabulary/proficiency/batch", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const wordsWithCorrectness = req.body.wordsWithCorrectness; // { wordId: number, isCorrect: boolean }[]

      if (!Array.isArray(wordsWithCorrectness)) {
        return res.status(400).json({ message: "Invalid word ID format" });
      }

      if (wordsWithCorrectness.length === 0) {
        return res.status(400).json({ message: "No words provided for proficiency update" });
      }

      let proficiencies: Proficiency[] = [];

      if (wordsWithCorrectness.every(w => "wordId" in w && "isCorrect" in w)) {
        proficiencies = await storage.updateWordProficiencyBatch(userId, wordsWithCorrectness);
      }
      else if (wordsWithCorrectness.every(w => "chinese" in w && "isCorrect" in w)) {
        proficiencies = await storage.updateWordProficiencyBatchByChinese(userId, wordsWithCorrectness)
      }
      else {
        return res.status(400).json({ message: "Invalid word format. Each word must have either wordId or chinese." });
      }

      res.json({proficiencies});
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update word proficiencies" });
    }
  });

  // Update proficiency for a word (after practice)
  app.patch("/api/vocabulary/proficiency/:wordId", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;
      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const wordId = parseInt(req.params.wordId);
      if (isNaN(wordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const { isCorrect } = req.body;
      if (typeof isCorrect !== 'boolean') {
        return res.status(400).json({ message: "isCorrect parameter is required and must be a boolean" });
      }

      const proficiency = await storage.updateWordProficiency(userId, wordId, isCorrect);

      res.json({
        proficiency
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update word proficiency" });
    }
  });

  // Reset proficiency for a word
  app.delete("/api/vocabulary/proficiency/:wordId", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const wordId = parseInt(req.params.wordId);

      if (isNaN(wordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      await storage.removeWordProficiency(userId, wordId);
      res.json({ message: "Word proficiency reset successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to reset word proficiency" });
    }
  });

  // Get proficiency for a specific word
  app.get("/api/vocabulary/full-proficiency/:wordId", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const wordId = parseInt(req.params.wordId); // Before: const wordId = req.body.wordId;

      if (isNaN(wordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const proficiency = await storage.getVocabularyWithProficiency(userId, wordId);

      if (!proficiency) {
        console.error("No proficiency found for word ID:", wordId);
        return res.status(400).json({ message: `Failed to fetch proficiency ${wordId} with userId: ${userId}` });
      }

      res.json({
        proficiency
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get word proficiency" });
    }
  });

  app.get("/api/vocabulary/full-proficiency", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const proficiencies = await storage.getAllVocabularyWithProficiency(userId);

      res.json(proficiencies);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get word proficiencies" });
    }
  });

  // Check if two words are synonyms
  app.post("/api/synonym-check", async (req, res) => {
    try {
      const { word1, word2 } = req.body;

      if (!word1 || !word2) {
        return res.status(400).json({
          message: "Both word1 and word2 are required",
          areSynonyms: false,
          confidence: 0
        });
      }

      // Use OpenAI to check if words are synonyms
      const result = await checkSynonyms(word1, word2);

      res.json(result);
    } catch (error) {
      console.error("Error checking synonyms:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to check synonyms",
        areSynonyms: false,
        confidence: 0
      });
    }
  });

  // Get leaderboard of top users by score
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getLeaderboard(limit);
      return res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user streak and score
  app.post("/api/user/streak", verifyFirebaseToken, firebaseAuth, async (req, res) => {
    try {
      const userId = req.authenticatedUserId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { isCorrect } = req.body;

      if (typeof isCorrect !== 'boolean') {
        return res.status(400).json({ message: "isCorrect is required and must be a boolean" });
      }

      // Get current user data
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Default values if not set
      const currentStreak = user.currentStreak || 0;
      const highestStreak = user.highestStreak || 0;
      const currentScore = user.currentScore || 0;
      const highestScore = user.highestScore || 0;

      let newCurrentStreak = currentStreak;
      let newHighestStreak = highestStreak;
      let newCurrentScore = currentScore;
      let newHighestScore = highestScore;

      // Calculate new values based on answer correctness
      if (isCorrect) {
        // Increment streak and calculate new score
        newCurrentStreak = currentStreak + 1;

        // Score increases exponentially with streak
        // Score = base_score * (1.5 ^ streak)
        // This makes each consecutive correct answer worth more
        const baseScore = 10;
        const multiplier = 1.5;
        const streakBonus = Math.pow(multiplier, Math.min(10, newCurrentStreak - 1)); // Cap for massive streaks
        newCurrentScore = currentScore + Math.ceil(baseScore * streakBonus);

        // Update highest streak if current streak is higher
        if (newCurrentStreak > highestStreak) {
          newHighestStreak = newCurrentStreak;
        }

        // Update highest score if current score is higher
        if (newCurrentScore > highestScore) {
          newHighestScore = newCurrentScore;
        }
      } else {
        // Reset streak and score on incorrect answer
        newCurrentStreak = 0;
        newCurrentScore = 0;
      }

      // Update user in database
      const updatedUser = await storage.updateUser(userId, {
        currentStreak: newCurrentStreak,
        highestStreak: newHighestStreak,
        currentScore: newCurrentScore,
        highestScore: newHighestScore,
        lastPracticeDate: new Date()
      });

      return res.json({
        currentStreak: updatedUser.currentStreak,
        highestStreak: updatedUser.highestStreak,
        currentScore: updatedUser.currentScore,
        highestScore: updatedUser.highestScore
      });
    } catch (error) {
      console.error("Error updating user streak:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============= CHARACTER DICTIONARY API ENDPOINTS =============

  // Search for characters by query (character or pinyin)
  app.get("/api/characters/search", async (req, res) => {
    try {
      const { q = "", query = "" } = req.query;
      // Allow both q and query parameters for flexibility
      const searchTerm = typeof query === 'string' && query.length > 0
        ? query
        : (typeof q === 'string' ? q : '');

      const characters = await storage.searchCharacters(searchTerm);
      res.json(characters);
    } catch (error) {
      console.error("Error searching characters:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to search characters" });
    }
  });

  // Get a specific character by ID
  app.get("/api/characters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const character = await storage.getCharacter(id);

      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      res.json(character);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch character" });
    }
  });

  // Get a character by its value (the actual Chinese character)
  app.get("/api/characters/value/:char", async (req, res) => {
    try {
      const charValue = req.params.char;

      if (!charValue) {
        return res.status(400).json({ message: "Character value is required" });
      }

      const character = await storage.getCharacterByValue(charValue);

      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      res.json(character);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch character" });
    }
  });

  // Add a new character
  app.post("/api/characters", async (req, res) => {
    try {
      const character = req.body;

      // Validate character
      const validatedCharacter = characterSchema.parse(character);

      // If no proper definition/pinyin provided, try to get it from OpenAI
      if ((!validatedCharacter.pinyin || validatedCharacter.pinyin === "pending" ||
           validatedCharacter.pinyin === "unknown") &&
          validatedCharacter.character && validatedCharacter.character.length === 1) {
        try {
          // Import the function from openai.ts
          const { getChineseCharacterDefinition } = await import("./openai");
          const charDetails = await getChineseCharacterDefinition(validatedCharacter.character);

          // Update with AI-generated definition and pinyin
          validatedCharacter.pinyin = charDetails.pinyin;

          // We'll add the definition separately after creating the character
          console.log(`Enhanced character ${validatedCharacter.character} with AI: ${JSON.stringify(charDetails)}`);
        } catch (aiError) {
          console.error("Failed to get AI definition:", aiError);
          // Continue with original values if AI definition fails
        }
      }

      const savedCharacter = await storage.addCharacter(validatedCharacter);
      res.status(201).json(savedCharacter);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: `Invalid character format: ${error.errors.map(e => e.message).join(', ')}`
        });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to add character" });
    }
  });

  // Get all definitions for a character
  app.get("/api/characters/:id/definitions", async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);

      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const definitions = await storage.getCharacterDefinitions(characterId);
      res.json(definitions);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch definitions" });
    }
  });

  // Get all compounds that a character is part of
  app.get("/api/characters/:id/compounds", async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);

      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const compounds = await storage.getCharacterCompounds(characterId);
      res.json(compounds);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch character compounds" });
    }
  });

  // Get all components of a compound character
  app.get("/api/characters/:id/components", async (req, res) => {
    try {
      const compoundId = parseInt(req.params.id);

      if (isNaN(compoundId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const components = await storage.getCompoundComponents(compoundId);
      res.json(components);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch compound components" });
    }
  });

  // Add a new definition to a character
  app.post("/api/characters/:id/definitions", async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);

      if (isNaN(characterId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Check if character exists
      const character = await storage.getCharacter(characterId);

      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      let definition = { ...req.body, characterId };

      // If the definition just says "Character X", try to get a better definition from OpenAI
      if (character && character.character && character.character.length === 1 &&
          (!definition.definition || definition.definition.startsWith("Character ") ||
           definition.definition === "Automatically added character")) {
        try {
          // Import the function from openai.ts
          const { getChineseCharacterDefinition } = await import("./openai");
          const charDetails = await getChineseCharacterDefinition(character.character);

          // Update with AI-generated definition
          definition.definition = charDetails.definition;
          console.log(`Enhanced definition for ${character.character} with AI: ${charDetails.definition}`);
        } catch (aiError) {
          console.error("Failed to get AI definition:", aiError);
          // Continue with original definition if AI definition fails
        }
      }

      // Validate definition
      const validatedDefinition = characterDefinitionSchema.parse(definition);

      const savedDefinition = await storage.addCharacterDefinition(validatedDefinition);
      res.status(201).json(savedDefinition);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: `Invalid definition format: ${error.errors.map(e => e.message).join(', ')}`
        });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to add definition" });
    }
  });

  // Update a character definition
  app.patch("/api/character-definitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const updates = req.body;
      const updatedDefinition = await storage.updateCharacterDefinition(id, updates);
      res.json(updatedDefinition);
    } catch (error) {
      res.status(404).json({ message: error instanceof Error ? error.message : "Definition not found" });
    }
  });

  // Delete a character definition
  app.delete("/api/character-definitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      await storage.deleteCharacterDefinition(id);
      res.json({ message: "Definition deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: error instanceof Error ? error.message : "Definition not found" });
    }
  });

  // Get all learned definitions for a user
  app.get("/api/users/:userId/learned-definitions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const learnedDefinitions = await storage.getLearnedDefinitions(userId);
      res.json(learnedDefinitions);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch learned definitions" });
    }
  });

  // Toggle a definition as learned/unlearned for a user
  app.post("/api/users/:userId/learned-definitions/:definitionId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const definitionId = parseInt(req.params.definitionId);

      if (isNaN(userId) || isNaN(definitionId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const { isLearned = true } = req.body;

      if (typeof isLearned !== 'boolean') {
        return res.status(400).json({ message: "isLearned must be a boolean" });
      }

      const result = await storage.toggleLearnedDefinition(userId, definitionId, isLearned);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update learned status" });
    }
  });

  // Update notes for a learned definition
  app.patch("/api/learned-definitions/:id/notes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const { notes } = req.body;

      if (typeof notes !== 'string') {
        return res.status(400).json({ message: "Notes must be a string" });
      }

      const updatedDefinition = await storage.updateLearnedDefinitionNotes(id, notes);
      res.json(updatedDefinition);
    } catch (error) {
      res.status(404).json({ message: error instanceof Error ? error.message : "Learned definition not found" });
    }
  });

  // Register dictionary admin routes
  app.use('/api', dictionaryAdminRoutes);
  app.use('/api/auth', authRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
