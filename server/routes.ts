import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { vocabularySchema, characterSchema, characterDefinitionSchema, learnedDefinitionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { generateSentence, generateSentenceWithWord, checkSynonyms } from "./openai";
import dictionaryAdminRoutes from "./routes/dictionary-admin";
import authRoutes from "./routes/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get dictionary vocabulary words (not user specific)
  app.get("/api/vocabulary/dictionary", async (req, res) => {
    try {
      const vocabulary = await storage.getAllVocabulary();
      res.json(vocabulary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });
  
  // Get user's vocabulary words (for authenticated users)
  app.get("/api/vocabulary", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (!userId) {
        // If no user ID provided, return global vocabulary (for non-logged-in users)
        const vocabulary = await storage.getAllVocabulary();
        return res.json(vocabulary);
      }
      
      // Get user's word proficiencies
      const proficiencies = await storage.getUserWordProficiencies(userId);
      
      // Filter only saved words
      const savedWords = proficiencies.filter(prof => prof.isSaved);
      
      // If user has no saved words, return empty array
      if (savedWords.length === 0) {
        return res.json([]);
      }
      
      // Get vocabulary details for each saved word
      const wordList = await Promise.all(savedWords.map(async (prof) => {
        const wordId = parseInt(prof.wordId);
        const word = await storage.getVocabulary(wordId);
        
        if (!word) {
          return null;
        }
        
        return {
          ...word,
          proficiency: prof
        };
      }));
      
      // Filter out any null values
      const filteredWordList = wordList.filter(word => word !== null);
      
      res.json(filteredWordList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  // Add vocabulary words
  app.post("/api/vocabulary", async (req, res) => {
    try {
      const { words } = req.body;
      
      if (!Array.isArray(words)) {
        return res.status(400).json({ message: "Words must be an array" });
      }
      
      const validatedWords = words.map(word => {
        try {
          return vocabularySchema.parse(word);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new Error(`Invalid word format: ${error.errors.map(e => e.message).join(', ')}`);
          }
          throw error;
        }
      });
      
      const savedWords = await Promise.all(
        validatedWords.map(word => storage.addVocabulary(word))
      );
      
      res.status(201).json(savedWords);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to add vocabulary" });
    }
  });

  // Import a list of vocabulary words
  app.post("/api/vocabulary/import", async (req, res) => {
    try {
      const { words, userId } = req.body;
      
      if (!Array.isArray(words)) {
        return res.status(400).json({ message: "Words must be an array" });
      }
      
      console.log(`[IMPORT DEBUG] Request received with ${words.length} words${userId ? ` for user ${userId}` : ''}`);
      console.log(`[IMPORT DEBUG] Input words array:`, JSON.stringify(words));
      
      // Instead of validating all words at once (which stops on first error),
      // validate each word individually and proceed with valid ones
      const validatedWords = [];
      const validationErrors = [];
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        try {
          console.log(`[IMPORT DEBUG] Validating word ${i}:`, JSON.stringify(word));
          
          // Pre-process the word data before validation
          const processedWord = {
            chinese: word.chinese?.trim() || '',
            pinyin: word.pinyin?.trim() || '',
            english: word.english?.trim() || '',
            active: word.active || 'true'
          };
          
          // Log preprocessing result
          console.log(`[IMPORT DEBUG] Preprocessed word ${i}:`, JSON.stringify(processedWord));
          
          const validWord = vocabularySchema.parse(processedWord);
          validatedWords.push(validWord);
          console.log(`[IMPORT DEBUG] Word ${i} passed validation:`, JSON.stringify(validWord));
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMsg = `Invalid word format: ${error.errors.map(e => e.message).join(', ')}`;
            console.error(`[IMPORT DEBUG] Validation error for word ${i} "${JSON.stringify(word)}": ${errorMsg}`);
            validationErrors.push({
              index: i,
              word: word.chinese || "unknown",
              error: errorMsg
            });
          } else {
            console.error(`[IMPORT DEBUG] Non-validation error for word ${i}:`, error);
            validationErrors.push({
              index: i,
              word: word.chinese || "unknown",
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
      
      console.log(`[IMPORT DEBUG] Successfully validated ${validatedWords.length} out of ${words.length} words`);
      console.log(`[IMPORT DEBUG] Validated words array:`, JSON.stringify(validatedWords));
      
      if (validationErrors.length > 0) {
        console.log(`[IMPORT DEBUG] Found ${validationErrors.length} validation errors:`, JSON.stringify(validationErrors));
      }
      
      // Process each validated word individually and track results
      const savedWords = [];
      const wordErrors = [];
      
      // First, add all words to the global dictionary
      for (let i = 0; i < validatedWords.length; i++) {
        const word = validatedWords[i];
        try {
          console.log(`[IMPORT DEBUG] Processing word ${i}:`, JSON.stringify(word));
          
          // Helper function to normalize pinyin for comparison
          const normalizePinyin = (pinyin: string) => {
            if (!pinyin) return '';
            return pinyin.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
              .toLowerCase()
              .replace(/\s+/g, ''); // Remove spaces
          };
          
          // Check if word already exists to avoid duplicates
          let existingWord = null;
          try {
            // Try to find by exact match first
            console.log(`[IMPORT DEBUG] Checking if word ${i} exists:`, word.chinese, word.pinyin);
            existingWord = await storage.getVocabularyByChineseAndPinyin(word.chinese, word.pinyin);
            
            // If not found by exact match, try with normalized pinyin
            if (!existingWord) {
              // Get all vocabulary and check for close matches
              const allVocab = await storage.getAllVocabulary();
              
              // For now just log normalized values to debug
              const normalizedInputPinyin = normalizePinyin(word.pinyin);
              console.log(`[IMPORT DEBUG] Normalized input pinyin: "${normalizedInputPinyin}"`);
              
              // Find potential match with same Chinese character and similar pinyin
              const potentialMatch = allVocab.find(v => 
                v.chinese === word.chinese && 
                normalizePinyin(v.pinyin) === normalizedInputPinyin
              );
              
              if (potentialMatch) {
                console.log(`[IMPORT DEBUG] Found similar match with normalized pinyin:`, potentialMatch);
                existingWord = potentialMatch;
              }
            }
            
            console.log(`[IMPORT DEBUG] Existing word check result:`, existingWord ? "Found" : "Not found");
          } catch (err) {
            console.error(`[IMPORT DEBUG] Error checking if word exists:`, err);
          }
          
          // Add the word if it doesn't exist
          let savedWord;
          if (existingWord) {
            savedWord = existingWord;
            console.log(`[IMPORT DEBUG] Word "${word.chinese}" (${i}) already exists, using existing word:`, JSON.stringify(existingWord));
          } else {
            console.log(`[IMPORT DEBUG] Adding new word ${i}:`, JSON.stringify(word));
            savedWord = await storage.addVocabulary(word);
            console.log(`[IMPORT DEBUG] Word ${i} added successfully:`, JSON.stringify(savedWord));
          }
          
          savedWords.push(savedWord);
          console.log(`[IMPORT DEBUG] Added word ${i} to savedWords array. Current saved count: ${savedWords.length}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[IMPORT DEBUG] Error adding word ${i} "${word.chinese}": ${errorMessage}`);
          wordErrors.push({
            index: i,
            word: word.chinese,
            error: errorMessage
          });
        }
      }
      
      // If userId is provided, also add these words to the user's personal list
      if (userId && !isNaN(parseInt(userId))) {
        const userIdNum = parseInt(userId);
        console.log(`[IMPORT DEBUG] Adding ${savedWords.length} words to user ${userIdNum}'s personal list`);
        
        // Add each word to the user's list
        for (let i = 0; i < savedWords.length; i++) {
          const word = savedWords[i];
          try {
            console.log(`[IMPORT DEBUG] Adding word ${i} (id: ${word.id}) to user ${userIdNum}'s list`);
            await storage.saveWordToUserList(userIdNum, word.id);
            console.log(`[IMPORT DEBUG] Added word ${i} to user's list successfully`);
          } catch (error) {
            console.error(`[IMPORT DEBUG] Error adding word ${i} (id: ${word.id}) to user ${userIdNum}'s list: ${error}`);
          }
        }
      }
      
      console.log(`[IMPORT DEBUG] Successfully saved ${savedWords.length} words out of ${words.length} total`);
      console.log(`[IMPORT DEBUG] Final savedWords array:`, JSON.stringify(savedWords.map(w => ({ id: w.id, chinese: w.chinese }))));
      
      if (wordErrors.length > 0) {
        console.log(`[IMPORT DEBUG] Encountered ${wordErrors.length} errors during import:`, JSON.stringify(wordErrors));
      }
      
      // Return all the saved words, including validation stats
      console.log(`[IMPORT DEBUG] Sending response with ${savedWords.length} saved words`);
      res.status(201).json({
        savedWords,
        stats: {
          totalRequested: words.length,
          validWords: validatedWords.length,
          savedWords: savedWords.length,
          validationErrors: validationErrors.length,
          saveErrors: wordErrors.length
        }
      });
    } catch (error) {
      console.error(`[IMPORT DEBUG] Import failed with unhandled error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to import vocabulary" });
    }
  });

  // Update a vocabulary word
  app.patch("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updates = req.body;
      const updatedWord = await storage.updateVocabulary(id, updates);
      res.status(200).json(updatedWord);
    } catch (error) {
      res.status(404).json({ message: error instanceof Error ? error.message : "Vocabulary not found" });
    }
  });

  // Delete a vocabulary word
  app.delete("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      await storage.deleteVocabulary(id);
      res.status(200).json({ message: "Vocabulary deleted" });
    } catch (error) {
      res.status(404).json({ message: "Vocabulary not found" });
    }
  });

  // Delete all vocabulary words
  app.delete("/api/vocabulary", async (req, res) => {
    try {
      await storage.deleteAllVocabulary();
      res.status(200).json({ message: "All vocabulary deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vocabulary" });
    }
  });

  // Get a specific vocabulary word by ID
  app.get("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const word = await storage.getVocabulary(id);
      
      if (!word) {
        return res.status(404).json({ message: "Vocabulary not found" });
      }
      
      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
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

  // Define fallback sentences here so they're only defined once
  const fallbackSentences = {
    beginner: [
      // Present tense sentences
      { chinese: "我很高兴。", pinyin: "Wǒ hěn gāoxìng.", english: "I am very happy." },
      { chinese: "今天天气很好。", pinyin: "Jīntiān tiānqì hěn hǎo.", english: "The weather is good today." },
      { chinese: "你好吗？", pinyin: "Nǐ hǎo ma?", english: "How are you?" },
      { chinese: "我喜欢学中文。", pinyin: "Wǒ xǐhuān xué Zhōngwén.", english: "I like learning Chinese." },
      { chinese: "谢谢你的帮助。", pinyin: "Xièxiè nǐ de bāngzhù.", english: "Thank you for your help." },
      { chinese: "我想喝水。", pinyin: "Wǒ xiǎng hē shuǐ.", english: "I want to drink water." },
      { chinese: "这个很有意思。", pinyin: "Zhège hěn yǒuyìsi.", english: "This is very interesting." },
      { chinese: "你叫什么名字？", pinyin: "Nǐ jiào shénme míngzi?", english: "What is your name?" },
      
      // Past tense sentences with 了
      { chinese: "我买了一本书。", pinyin: "Wǒ mǎi le yī běn shū.", english: "I bought a book." },
      { chinese: "他去了图书馆。", pinyin: "Tā qù le túshūguǎn.", english: "He went to the library." },
      { chinese: "我们吃了晚饭。", pinyin: "Wǒmen chī le wǎnfàn.", english: "We ate dinner." },
      { chinese: "我看了这部电影。", pinyin: "Wǒ kàn le zhè bù diànyǐng.", english: "I watched this movie." },
      { chinese: "我学了新的汉字。", pinyin: "Wǒ xué le xīn de hànzì.", english: "I learned new Chinese characters." },
      { chinese: "昨天下了雨。", pinyin: "Zuótiān xià le yǔ.", english: "It rained yesterday." },
      { chinese: "他写了一封信。", pinyin: "Tā xiě le yī fēng xìn.", english: "He wrote a letter." },
      { chinese: "我吃了早饭。", pinyin: "Wǒ chī le zǎofàn.", english: "I ate breakfast." },
      
      // Future tense or modal sentences
      { chinese: "明天我要去学校。", pinyin: "Míngtiān wǒ yào qù xuéxiào.", english: "Tomorrow I will go to school." },
      { chinese: "下周我们会见面。", pinyin: "Xià zhōu wǒmen huì jiànmiàn.", english: "We will meet next week." },
      { chinese: "我可以帮你吗？", pinyin: "Wǒ kěyǐ bāng nǐ ma?", english: "Can I help you?" },
      { chinese: "他会说中文。", pinyin: "Tā huì shuō Zhōngwén.", english: "He can speak Chinese." }
    ],
    intermediate: [
      // Present tense sentences
      { chinese: "这本书很有意思。", pinyin: "Zhè běn shū hěn yǒuyìsi.", english: "This book is very interesting." },
      { chinese: "中国菜很好吃。", pinyin: "Zhōngguó cài hěn hǎochī.", english: "Chinese food is delicious." },
      { chinese: "你能帮我一下吗？", pinyin: "Nǐ néng bāng wǒ yīxià ma?", english: "Can you help me?" },
      { chinese: "我在北京工作。", pinyin: "Wǒ zài Běijīng gōngzuò.", english: "I work in Beijing." },
      
      // Past tense with 了
      { chinese: "我昨天去了图书馆。", pinyin: "Wǒ zuótiān qù le túshūguǎn.", english: "I went to the library yesterday." },
      { chinese: "他已经看完了这本书。", pinyin: "Tā yǐjīng kàn wán le zhè běn shū.", english: "He has finished reading this book." },
      { chinese: "我们参观了故宫。", pinyin: "Wǒmen cānguān le Gùgōng.", english: "We visited the Forbidden City." },
      { chinese: "他学了三年中文了。", pinyin: "Tā xué le sān nián Zhōngwén le.", english: "He has been learning Chinese for three years." },
      { chinese: "我们认识了很多新朋友。", pinyin: "Wǒmen rènshí le hěn duō xīn péngyǒu.", english: "We met many new friends." },
      
      // Future tense
      { chinese: "我明天要去北京。", pinyin: "Wǒ míngtiān yào qù Běijīng.", english: "I will go to Beijing tomorrow." },
      { chinese: "下个月我会回国。", pinyin: "Xià gè yuè wǒ huì huí guó.", english: "I will return to my country next month." },
      { chinese: "我打算学习中文。", pinyin: "Wǒ dǎsuàn xuéxí Zhōngwén.", english: "I plan to study Chinese." }
    ],
    advanced: [
      // Complex sentences with 了 and other grammar patterns
      { chinese: "我已经学了三年中文了，但是还是说得不太流利。", pinyin: "Wǒ yǐjīng xué le sān nián Zhōngwén le, dànshì háishì shuō de bú tài liúlì.", english: "I have been learning Chinese for three years, but I still don't speak very fluently." },
      { chinese: "虽然学习中文很难，但是很有意思。", pinyin: "Suīrán xuéxí Zhōngwén hěn nán, dànshì hěn yǒuyìsi.", english: "Although learning Chinese is difficult, it is very interesting." },
      { chinese: "如果明天天气好的话，我们可以去公园。", pinyin: "Rúguǒ míngtiān tiānqì hǎo dehuà, wǒmen kěyǐ qù gōngyuán.", english: "If the weather is good tomorrow, we can go to the park." },
      { chinese: "我认为学习语言的最好方法是每天练习。", pinyin: "Wǒ rènwéi xuéxí yǔyán de zuì hǎo fāngfǎ shì měitiān liànxí.", english: "I think the best way to learn a language is to practice every day." },
      { chinese: "昨天我看了一部电影，这部电影讲的是中国历史。", pinyin: "Zuótiān wǒ kàn le yī bù diànyǐng, zhè bù diànyǐng jiǎng de shì Zhōngguó lìshǐ.", english: "Yesterday I watched a movie that was about Chinese history." },
      { chinese: "我们吃完了饭，就去看电影了。", pinyin: "Wǒmen chī wán le fàn, jiù qù kàn diànyǐng le.", english: "After we finished eating, we went to see a movie." },
      { chinese: "他告诉我他已经去过北京了。", pinyin: "Tā gàosù wǒ tā yǐjīng qùguò Běijīng le.", english: "He told me he had already been to Beijing." },
      { chinese: "学习汉语不仅要学习语法，还要了解中国文化。", pinyin: "Xuéxí Hànyǔ bùjǐn yào xuéxí yǔfǎ, hái yào liǎojiě Zhōngguó wénhuà.", english: "Learning Chinese requires not only learning grammar, but also understanding Chinese culture." }
    ]
  };

  // Track word usage to ensure all words get used in practice
  const wordUsageStats: Record<number, { uses: number, lastUsed: number }> = {};
  
  // Background cache filler function - runs in the background to keep the cache filled
  async function fillSentenceCache() {
    try {
      // Get all vocabulary words once for efficiency
      const allVocabulary = await storage.getAllVocabulary();
      const activeVocabulary = allVocabulary.filter(word => word.active === "true");
      
      if (activeVocabulary.length === 0) return; // Nothing to cache if no vocabulary
      
      // Function to select words, prioritizing less frequently used words
      const selectWords = (wordsList: Array<{ id: number, chinese: string, [key: string]: any }>, count: number) => {
        // Ensure we don't try to select more words than available
        const selectionCount = Math.min(count, wordsList.length);
        
        // Create a weighted list based on usage
        const weightedWords = wordsList.map(word => {
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
      
      // Word count per difficulty level
      const wordCounts = {
        beginner: 3,
        intermediate: 5,
        advanced: 7
      };
      
      // Fill cache for each difficulty if needed
      for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
        // Only fill if we need more sentences
        if (sentenceCache[difficulty].length < sentenceCache.maxSize) {
          try {
            // Select a subset of vocabulary words, prioritizing less used words
            const selectedWords = selectWords(
              activeVocabulary, 
              wordCounts[difficulty]
            );
            
            console.log(`Generating ${difficulty} sentence with words:`, 
              selectedWords.map(w => w.chinese).join(', '));
            
            // Generate a new sentence using the selected words
            // We need to ensure the vocabulary has the right format for generateSentence
            const sentenceVocabulary = selectedWords.map(word => ({
              chinese: word.chinese,
              pinyin: typeof word.pinyin === 'string' ? word.pinyin : "",
              english: typeof word.english === 'string' ? word.english : ""
            }));
            const sentence = await generateSentence(sentenceVocabulary, difficulty);
            
            // Update word usage statistics
            selectedWords.forEach(word => {
              if (!wordUsageStats[word.id]) {
                wordUsageStats[word.id] = { uses: 0, lastUsed: 0 };
              }
              wordUsageStats[word.id].uses += 1;
              wordUsageStats[word.id].lastUsed = Date.now();
            });
            
            // Add to the cache if it's not a duplicate
            const isDuplicate = sentenceCache[difficulty].some(s => s.chinese === sentence.chinese);
            if (!isDuplicate) {
              sentenceCache[difficulty].push({
                ...sentence,
                difficulty,
                createdAt: Date.now(),
                usedWords: selectedWords.map(w => w.id) // Track which words were used
              });
              console.log(`Added sentence to ${difficulty} cache: ${sentence.chinese}`);
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
  app.post("/api/sentence/generate", async (req, res) => {
    try {
      const { difficulty = "beginner" } = req.body;
      const typedDifficulty = difficulty as 'beginner' | 'intermediate' | 'advanced';
      
      // Helper function to select words, prioritizing less frequently used words
      const selectWords = (wordsList: Array<{ id: number, chinese: string, [key: string]: any }>, count: number) => {
        // Ensure we don't try to select more words than available
        const selectionCount = Math.min(count, wordsList.length);
        
        // Create a weighted list based on usage
        const weightedWords = wordsList.map(word => {
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
      // Get all vocabulary words 
      const allVocabulary = await storage.getAllVocabulary();
      
      // Filter for only active words
      const activeVocabulary = allVocabulary.filter(word => word.active === "true");
      
      if (activeVocabulary.length === 0) {
        return res.status(400).json({ message: "No active vocabulary words available. Please add or activate some words first." });
      }
      
      // Generate new sentence using OpenAI with retries and fallback
      try {
        // Word count per difficulty level
        const wordCounts = {
          beginner: 3,
          intermediate: 5,
          advanced: 7
        };
        
        // Select a subset of vocabulary words, prioritizing less used words
        const selectedWords = selectWords(
          activeVocabulary, 
          wordCounts[typedDifficulty]
        );
        
        console.log(`Generating on-demand ${typedDifficulty} sentence with words:`, 
          selectedWords.map(w => w.chinese).join(', '));
        
        // Generate a sentence using the selected words
        // We need to ensure the vocabulary has the right format for generateSentence
        const sentenceVocabulary = selectedWords.map(word => ({
          chinese: word.chinese,
          pinyin: typeof word.pinyin === 'string' ? word.pinyin : "",
          english: typeof word.english === 'string' ? word.english : ""
        }));
        const sentence = await generateSentence(sentenceVocabulary, typedDifficulty);
        
        // Update word usage statistics
        selectedWords.forEach(word => {
          if (!wordUsageStats[word.id]) {
            wordUsageStats[word.id] = { uses: 0, lastUsed: 0 };
          }
          wordUsageStats[word.id].uses += 1;
          wordUsageStats[word.id].lastUsed = Date.now();
        });
        
        // Add to cache for future use
        if (sentenceCache[typedDifficulty].length < sentenceCache.maxSize) {
          sentenceCache[typedDifficulty].push({
            ...sentence,
            difficulty: typedDifficulty,
            createdAt: Date.now(),
            usedWords: selectedWords.map(w => w.id) // Track which words were used
          });
        }
        
        res.json(sentence);
      } catch (generateError) {
        console.log("Error generating sentence with OpenAI, using fallback sentences");
        
        // Select a random fallback sentence based on difficulty
        const fallbackOptions = fallbackSentences[typedDifficulty] || fallbackSentences.beginner;
        const randomFallback = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
        
        res.json({
          ...randomFallback,
          difficulty: typedDifficulty,
          fromFallback: true // Mark that this is a fallback sentence
        });
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
      
      // Generate sentence using OpenAI with specific word, with fallback
      try {
        const sentence = await generateSentenceWithWord(word, difficulty);
        res.json(sentence);
      } catch (generateError) {
        console.log(`Error generating sentence with word "${word}", using fallback`);
        
        // Create fallback sentences with proper grammar using the word
        const fallbackSentences = [
          // Present tense templates
          { template: "我喜欢{word}。", english: "I like {word}.", pinyin: "Wǒ xǐhuān {word}." },
          { template: "这是{word}。", english: "This is {word}.", pinyin: "Zhè shì {word}." },
          { template: "我有{word}。", english: "I have {word}.", pinyin: "Wǒ yǒu {word}." },
          { template: "我想要{word}。", english: "I want {word}.", pinyin: "Wǒ xiǎng yào {word}." },
          { template: "{word}很好。", english: "{word} is good.", pinyin: "{word} hěn hǎo." },
          { template: "我们学习{word}。", english: "We learn {word}.", pinyin: "Wǒmen xuéxí {word}." },
          
          // Past tense templates with 了
          { template: "我买了{word}。", english: "I bought {word}.", pinyin: "Wǒ mǎi le {word}." },
          { template: "我看了{word}。", english: "I saw {word}.", pinyin: "Wǒ kàn le {word}." },
          { template: "我们用了{word}。", english: "We used {word}.", pinyin: "Wǒmen yòng le {word}." },
          { template: "我学了{word}。", english: "I learned {word}.", pinyin: "Wǒ xué le {word}." },
          { template: "我昨天去了{word}。", english: "I went to {word} yesterday.", pinyin: "Wǒ zuótiān qù le {word}." },
          
          // Future tense templates
          { template: "明天我要去{word}。", english: "Tomorrow I will go to {word}.", pinyin: "Míngtiān wǒ yào qù {word}." },
          { template: "我会学习{word}。", english: "I will study {word}.", pinyin: "Wǒ huì xuéxí {word}." },
          { template: "我想看{word}。", english: "I want to see {word}.", pinyin: "Wǒ xiǎng kàn {word}." }
        ];
        
        // Select a random template
        const randomTemplate = fallbackSentences[Math.floor(Math.random() * fallbackSentences.length)];
        
        // Replace the placeholder with the actual word in all fields
        const chinese = randomTemplate.template.replace('{word}', word);
        const english = randomTemplate.english.replace('{word}', word);
        const pinyin = randomTemplate.pinyin.replace('{word}', word);
        
        res.json({
          chinese,
          pinyin,
          english,
          difficulty,
          fromFallback: true
        });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate sentence" });
    }
  });

  // Get proficiency for a specific word
  app.get("/api/word-proficiency/:wordId", async (req, res) => {
    try {
      const wordId = parseInt(req.params.wordId);
      
      if (isNaN(wordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const proficiency = await storage.getWordProficiency(wordId);
      if (!proficiency) {
        return res.json({ 
          wordId: wordId.toString(),
          correctCount: "0",
          attemptCount: "0",
          lastPracticed: "0",
          proficiencyPercent: 0
        });
      }
      
      // Calculate proficiency percentage
      const correct = parseInt(proficiency.correctCount);
      const attempts = parseInt(proficiency.attemptCount);
      const proficiencyPercent = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      
      res.json({
        ...proficiency,
        proficiencyPercent
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get word proficiency" });
    }
  });

  // Update proficiency for a word (after practice)
  app.post("/api/word-proficiency/:wordId", async (req, res) => {
    try {
      const wordId = parseInt(req.params.wordId);
      
      if (isNaN(wordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { isCorrect } = req.body;
      if (typeof isCorrect !== 'boolean') {
        return res.status(400).json({ message: "isCorrect parameter is required and must be a boolean" });
      }
      
      const proficiency = await storage.updateWordProficiency(wordId, isCorrect);
      
      // Calculate proficiency percentage
      const correct = parseInt(proficiency.correctCount);
      const attempts = parseInt(proficiency.attemptCount);
      const proficiencyPercent = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      
      res.json({
        ...proficiency,
        proficiencyPercent
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update word proficiency" });
    }
  });
  
  // Reset proficiency for a word
  app.delete("/api/word-proficiency/:wordId", async (req, res) => {
    try {
      const wordId = parseInt(req.params.wordId);
      
      if (isNaN(wordId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      await storage.resetWordProficiency(wordId);
      res.json({ message: "Word proficiency reset successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to reset word proficiency" });
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
      
      console.log(`Checking if "${word1}" and "${word2}" are synonyms`);
      
      // Use OpenAI to check if words are synonyms
      const result = await checkSynonyms(word1, word2);
      
      console.log(`Synonym check result: ${JSON.stringify(result)}`);
      
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

  // ============= CHARACTER DICTIONARY API ENDPOINTS =============

  // Search for characters by query (character or pinyin)
  app.get("/api/characters/search", async (req, res) => {
    try {
      const { q = "", query = "" } = req.query;
      // Allow both q and query parameters for flexibility
      const searchTerm = typeof query === 'string' && query.length > 0 
        ? query 
        : (typeof q === 'string' ? q : '');
      
      console.log(`Searching characters with term: "${searchTerm}"`);
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
        return res.status(400).json({ message: "Invalid user ID format" });
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
