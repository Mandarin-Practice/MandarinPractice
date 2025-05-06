import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { storage } from "./storage";
import { checkSynonyms, generateSentence, generateSentenceWithWord } from "./openai";
import { checkIfDatabaseNeedsSeed, seedDatabaseWithBasicDictionary, runFullDictionaryImport } from "./db-seed";
import { importHSKAndICVocabulary } from "./hsk-import";

// WebSocket connections for realtime updates
const connections = new Set<WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Check if we need to seed the database with basic dictionary data
  try {
    if (await checkIfDatabaseNeedsSeed()) {
      console.log("Database needs to be seeded with initial data. This may take a minute...");
      await seedDatabaseWithBasicDictionary();
      console.log("Database seeded successfully with basic dictionary data");
    }
  } catch (error) {
    console.error("Error checking or seeding database:", error);
  }
  
  // ============= VOCABULARY API ENDPOINTS =============
  
  // Get all vocabulary
  app.get("/api/vocabulary", async (_req, res) => {
    try {
      const vocabulary = await storage.getAllVocabulary();
      res.json(vocabulary);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to retrieve vocabulary" });
    }
  });
  
  // Get a specific vocabulary word
  app.get("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const word = await storage.getVocabulary(id);
      
      if (!word) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }
      
      res.json(word);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to retrieve vocabulary word" });
    }
  });
  
  // Add a new vocabulary word
  app.post("/api/vocabulary", async (req, res) => {
    try {
      const newWord = req.body;
      
      // Validate required fields
      if (!newWord.chinese || !newWord.english || !newWord.pinyin) {
        return res.status(400).json({ message: "Chinese, English, and Pinyin fields are required" });
      }
      
      const word = await storage.addVocabulary(newWord);
      res.status(201).json(word);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to add vocabulary word" });
    }
  });
  
  // Update a vocabulary word
  app.patch("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const word = await storage.getVocabulary(id);
      
      if (!word) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }
      
      const updatedWord = await storage.updateVocabulary(id, updates);
      res.json(updatedWord);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update vocabulary word" });
    }
  });
  
  // Delete a vocabulary word
  app.delete("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const word = await storage.getVocabulary(id);
      
      if (!word) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }
      
      await storage.deleteVocabulary(id);
      res.json({ message: "Vocabulary word deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete vocabulary word" });
    }
  });
  
  // Create a bulk import of vocabulary words
  app.post("/api/vocabulary/import", async (req, res) => {
    try {
      const { words } = req.body;
      
      if (!Array.isArray(words) || words.length === 0) {
        return res.status(400).json({ message: "Words array is required and must not be empty" });
      }
      
      const importedWords = [];
      
      for (const word of words) {
        if (!word.chinese || !word.english || !word.pinyin) {
          return res.status(400).json({ message: "All words must have Chinese, English, and Pinyin fields" });
        }
        
        const importedWord = await storage.addVocabulary(word);
        importedWords.push(importedWord);
      }
      
      res.status(201).json({ 
        message: `Successfully imported ${importedWords.length} vocabulary words`,
        words: importedWords 
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to import vocabulary words" });
    }
  });
  
  // Import HSK vocabulary lists
  app.post("/api/vocabulary/import-hsk", async (req, res) => {
    try {
      const { level } = req.body;
      
      if (!level || typeof level !== 'number' || level < 1 || level > 6) {
        return res.status(400).json({ message: "Valid HSK level (1-6) is required" });
      }
      
      await importHSKAndICVocabulary();
      
      res.status(200).json({ message: `Successfully imported HSK level ${level} vocabulary` });
    } catch (error) {
      console.error("Error importing HSK vocabulary:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to import HSK vocabulary" });
    }
  });
  
  // Delete all vocabulary
  app.delete("/api/vocabulary", async (_req, res) => {
    try {
      await storage.deleteAllVocabulary();
      res.json({ message: "All vocabulary words deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete all vocabulary words" });
    }
  });
  
  // ============= PRACTICE API ENDPOINTS =============
  
  // Generate sentence for practice
  app.post("/api/sentence/generate", async (req, res) => {
    try {
      const { difficulty = "beginner" } = req.body;
      
      // Get all vocabulary words
      const allVocabulary = await storage.getAllVocabulary();
      
      // Filter for only active words
      const activeVocabulary = allVocabulary.filter(word => word.active === "true");
      
      if (activeVocabulary.length === 0) {
        return res.status(400).json({ message: "No active vocabulary words available. Please add or activate some words first." });
      }
      
      // Safe pre-vetted beginner sentences
      const safeBeginnerSentences = [
        { chinese: "我很好。", pinyin: "Wǒ hěn hǎo.", english: "I am very well." },
        { chinese: "你好吗？", pinyin: "Nǐ hǎo ma?", english: "How are you?" },
        { chinese: "请喝水。", pinyin: "Qǐng hē shuǐ.", english: "Please drink water." },
        { chinese: "谢谢你。", pinyin: "Xièxiè nǐ.", english: "Thank you." },
        { chinese: "我喜欢。", pinyin: "Wǒ xǐhuān.", english: "I like it." },
        { chinese: "你吃了吗？", pinyin: "Nǐ chī le ma?", english: "Have you eaten?" },
        { chinese: "我不知道。", pinyin: "Wǒ bù zhīdào.", english: "I don't know." },
        { chinese: "再见。", pinyin: "Zàijiàn.", english: "Goodbye." }
      ];
      
      // Create fallback sentences for other difficulty levels
      const fallbackSentences = {
        intermediate: [
          { chinese: "这本书很有意思。", pinyin: "Zhè běn shū hěn yǒuyìsi.", english: "This book is very interesting." },
          { chinese: "中国菜很好吃。", pinyin: "Zhōngguó cài hěn hǎochī.", english: "Chinese food is delicious." },
          { chinese: "你能帮我吗？", pinyin: "Nǐ néng bāng wǒ ma?", english: "Can you help me?" },
          { chinese: "我在学校。", pinyin: "Wǒ zài xuéxiào.", english: "I am at school." },
          { chinese: "我们明天见。", pinyin: "Wǒmen míngtiān jiàn.", english: "See you tomorrow." },
          { chinese: "我认为很好。", pinyin: "Wǒ rènwéi hěn hǎo.", english: "I think it's very good." }
        ],
        advanced: [
          { chinese: "我认为学习语言很重要。", pinyin: "Wǒ rènwéi xuéxí yǔyán hěn zhòngyào.", english: "I think learning languages is important." },
          { chinese: "虽然很难，但是很有用。", pinyin: "Suīrán hěn nán, dànshì hěn yǒuyòng.", english: "Although it's difficult, it's very useful." },
          { chinese: "今天我们学了新的单词。", pinyin: "Jīntiān wǒmen xué le xīn de dāncí.", english: "Today we learned new words." },
          { chinese: "下次我会做得更好。", pinyin: "Xià cì wǒ huì zuò de gèng hǎo.", english: "Next time I will do better." }
        ]
      };
      
      let sentence;
      
      // Helper function to check if all chars in a sentence are in the vocabulary list
      const containsOnlyKnownChars = (text: string, vocabList: string[]) => {
        // Create a set of all characters in the vocabulary
        const knownChars = new Set<string>();
        vocabList.forEach(word => {
          for (const char of word) {
            knownChars.add(char);
          }
        });
        
        // Common punctuation to ignore
        const punctuation = new Set(["。", "，", "？", "！", "、", "：", "；", "（", "）", """, """, "…", "—"]);
        
        // Check each character
        for (const char of text) {
          if (!knownChars.has(char) && !punctuation.has(char)) {
            return false;
          }
        }
        return true;
      };
      
      // First try to generate a proper sentence with OpenAI
      try {
        sentence = await generateSentence(activeVocabulary, difficulty);
        
        // For beginner level, verify all characters are known
        if (difficulty === "beginner") {
          const allWordsAreKnown = containsOnlyKnownChars(
            sentence.chinese, 
            activeVocabulary.map(v => v.chinese)
          );
          
          if (!allWordsAreKnown) {
            throw new Error("Generated sentence contains unknown characters");
          }
        }
      } catch (error) {
        // If generation fails, use fallback sentences
        console.log("Error generating sentence, using fallback:", error);
        
        // Choose appropriate fallback sentence set
        let options;
        if (difficulty === "beginner") {
          options = safeBeginnerSentences;
        } else {
          options = fallbackSentences[difficulty as keyof typeof fallbackSentences] || safeBeginnerSentences;
        }
        
        // Pick a random fallback sentence
        const randomIndex = Math.floor(Math.random() * options.length);
        sentence = {
          ...options[randomIndex],
          difficulty,
          fromFallback: true
        };
      }
      
      // Return the sentence (either generated or fallback)
      return res.json(sentence);
    } catch (error) {
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate sentence"
      });
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
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get character" });
    }
  });
  
  // Get definitions for a specific character
  app.get("/api/characters/:id/definitions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const definitions = await storage.getCharacterDefinitions(id);
      res.json(definitions);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get character definitions" });
    }
  });
  
  // Get compounds that contain a character as a component
  app.get("/api/characters/:id/compounds", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const compounds = await storage.getCharacterCompounds(id);
      res.json(compounds);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get character compounds" });
    }
  });
  
  // Get components that make up a compound character
  app.get("/api/characters/:id/components", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const components = await storage.getCompoundComponents(id);
      res.json(components);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get character components" });
    }
  });
  
  // ============= LEARNED DEFINITIONS API ENDPOINTS =============
  
  // Get all learned definitions for a user
  app.get("/api/learned-definitions", async (req, res) => {
    try {
      // For now, we'll use a hardcoded user ID of 1 - in a future version with auth, this would come from the authenticated user
      const userId = 1;
      
      const learnedDefinitions = await storage.getLearnedDefinitions(userId);
      res.json(learnedDefinitions);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get learned definitions" });
    }
  });
  
  // Toggle learned status for a definition
  app.post("/api/learned-definitions/:defId", async (req, res) => {
    try {
      const defId = parseInt(req.params.defId);
      const { isLearned = true } = req.body;
      
      if (isNaN(defId)) {
        return res.status(400).json({ message: "Invalid definition ID format" });
      }
      
      // For now, we'll use a hardcoded user ID of 1 - in a future version with auth, this would come from the authenticated user
      const userId = 1;
      
      const learnedDefinition = await storage.toggleLearnedDefinition(userId, defId, isLearned);
      res.json(learnedDefinition);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to toggle learned definition" });
    }
  });
  
  // Update notes for a learned definition
  app.patch("/api/learned-definitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      if (typeof notes !== 'string') {
        return res.status(400).json({ message: "Notes must be a string" });
      }
      
      const learnedDefinition = await storage.updateLearnedDefinitionNotes(id, notes);
      res.json(learnedDefinition);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update learned definition notes" });
    }
  });
  
  // ============= ADMIN API ENDPOINTS =============
  
  // Import full dictionary data (admin operation - can take a while)
  app.post("/api/admin/import-dictionary", async (_req, res) => {
    try {
      // Send an initial response to prevent timeout
      res.write(JSON.stringify({ status: "started", message: "Starting full dictionary import..." }));
      
      // Create a WebSocket server to send progress updates
      const httpServer = createServer(app);
      const wss = new WebSocketServer({ server: httpServer });
      
      wss.on("connection", (ws) => {
        console.log("Admin client connected to import progress stream");
        connections.add(ws);
        
        ws.on("close", () => {
          connections.delete(ws);
        });
      });
      
      // Start the import process
      const importResult = await runFullDictionaryImport();
      
      // Send final result
      res.write(JSON.stringify({ 
        status: "completed", 
        success: importResult,
        message: importResult ? "Dictionary import completed successfully" : "Dictionary import failed"
      }));
      res.end();
    } catch (error) {
      console.error("Error importing dictionary:", error);
      res.status(500).json({ 
        status: "error",
        message: error instanceof Error ? error.message : "Failed to import dictionary data" 
      });
    }
  });
  
  // Setup HTTP server
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer });
  
  wss.on("connection", (ws) => {
    console.log("Client connected");
    connections.add(ws);
    
    ws.send(JSON.stringify({ message: "Connected to server" }));
    
    ws.on("close", () => {
      console.log("Client disconnected");
      connections.delete(ws);
    });
    
    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
    });
  });
  
  return httpServer;
}

// Helper function to send a message to all connected WebSocket clients
function sendToAll(data: any) {
  const message = JSON.stringify(data);
  connections.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}