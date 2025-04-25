import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { vocabularySchema } from "@shared/schema";
import { ZodError } from "zod";
import { generateSentence, generateSentenceWithWord } from "./openai";

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

  const httpServer = createServer(app);
  return httpServer;
}
