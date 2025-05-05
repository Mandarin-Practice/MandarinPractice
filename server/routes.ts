import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { vocabularySchema } from "@shared/schema";
import { ZodError } from "zod";
import { generateSentence, generateSentenceWithWord, checkSynonyms } from "./openai";

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

  const httpServer = createServer(app);
  return httpServer;
}
