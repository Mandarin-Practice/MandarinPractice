import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { vocabularySchema, characterSchema, characterDefinitionSchema, learnedDefinitionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { generateSentence, generateSentenceWithWord, checkSynonyms } from "./openai";
import dictionaryAdminRoutes from "./routes/dictionary-admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all vocabulary words
  app.get("/api/vocabulary", async (req, res) => {
    try {
      const vocabulary = await storage.getAllVocabulary();
      res.json(vocabulary);
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
      const { words } = req.body;
      
      if (!Array.isArray(words)) {
        return res.status(400).json({ message: "Words must be an array" });
      }
      
      console.log(`Import request received with ${words.length} words`);
      
      // First, validate all words using the schema
      const validatedWords = words.map(word => {
        try {
          return vocabularySchema.parse(word);
        } catch (error) {
          if (error instanceof ZodError) {
            const errorMsg = `Invalid word format: ${error.errors.map(e => e.message).join(', ')}`;
            console.error(`Validation error for word "${JSON.stringify(word)}": ${errorMsg}`);
            throw new Error(errorMsg);
          }
          throw error;
        }
      });
      
      console.log(`Successfully validated ${validatedWords.length} words`);
      
      // Instead of using Promise.all (which might silently swallow errors),
      // process each word individually and track results
      const savedWords = [];
      const wordErrors = [];
      
      for (const word of validatedWords) {
        try {
          const savedWord = await storage.addVocabulary(word);
          savedWords.push(savedWord);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error adding word "${word.chinese}": ${errorMessage}`);
          wordErrors.push({
            word: word.chinese,
            error: errorMessage
          });
        }
      }
      
      console.log(`Successfully saved ${savedWords.length} words out of ${validatedWords.length}`);
      if (wordErrors.length > 0) {
        console.log(`Encountered ${wordErrors.length} errors during import`);
        console.log(wordErrors);
      }
      
      // Return all the saved words, without the errors
      res.status(201).json(savedWords);
    } catch (error) {
      console.error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
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

  // Generate a sentence using the user's vocabulary
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
      
      // Generate sentence using OpenAI
      const sentence = await generateSentence(activeVocabulary, difficulty);
      
      res.json(sentence);
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
      const sentence = await generateSentenceWithWord(word, difficulty);
      
      res.json(sentence);
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
      
      const definition = { ...req.body, characterId };
      
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

  const httpServer = createServer(app);
  return httpServer;
}
