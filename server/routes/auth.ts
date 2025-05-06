import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Check if the user is authenticated
router.get("/api/auth/status", async (req, res) => {
  try {
    // If no firebase UID is provided, return unauthorized
    if (!req.query.firebaseUid) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const firebaseUid = req.query.firebaseUid as string;
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Omit password field from response for security
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Auth status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Register or login with Firebase authentication
router.post("/api/auth/firebase", async (req, res) => {
  try {
    const { firebaseUid, email, displayName, photoUrl } = req.body;
    
    if (!firebaseUid) {
      return res.status(400).json({ message: "Firebase UID is required" });
    }
    
    // Check if user already exists
    let user = await storage.getUserByFirebaseUid(firebaseUid);
    
    if (user) {
      // User exists, update their information if needed
      if (email && email !== user.email) {
        user = await storage.updateUser(user.id, { email });
      }
      
      if (displayName && displayName !== user.displayName) {
        user = await storage.updateUser(user.id, { displayName });
      }
      
      if (photoUrl && photoUrl !== user.photoUrl) {
        user = await storage.updateUser(user.id, { photoUrl });
      }
      
      // Omit password field from response for security
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({ user: userWithoutPassword, isNewUser: false });
    }
    
    // User doesn't exist, create a new account
    // Generate a username from email or display name
    let username = displayName 
      ? displayName.replace(/\s+/g, "_").toLowerCase() 
      : email.split("@")[0];
      
    // Add random number to ensure uniqueness
    username = `${username}_${Math.floor(Math.random() * 10000)}`;
    
    // Create the user
    const newUser = await storage.createUser({
      username,
      firebaseUid,
      email,
      displayName,
      photoUrl
    });
    
    // Omit password field from response for security
    const { password, ...userWithoutPassword } = newUser;
    return res.status(201).json({ user: userWithoutPassword, isNewUser: true });
  } catch (error) {
    console.error("Firebase auth error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get user's saved word list
router.get("/api/auth/wordlist", async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const userId = parseInt(req.query.userId as string);
    const userWordProficiencies = await storage.getUserWordProficiencies(userId);
    
    // Only include words that are explicitly saved
    const savedWords = userWordProficiencies.filter(word => word.isSaved);
    
    // Get the vocabulary details for each word
    const wordList = [];
    for (const proficiency of savedWords) {
      const wordId = parseInt(proficiency.wordId);
      const vocab = await storage.getVocabulary(wordId);
      
      if (vocab) {
        wordList.push({
          ...vocab,
          proficiency
        });
      }
    }
    
    return res.status(200).json(wordList);
  } catch (error) {
    console.error("Word list error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Save a word to user's list
router.post("/api/auth/wordlist/save", async (req, res) => {
  try {
    const { userId, wordId } = req.body;
    
    if (!userId || !wordId) {
      return res.status(400).json({ message: "User ID and Word ID are required" });
    }
    
    const savedWord = await storage.saveWordToUserList(userId, wordId);
    return res.status(200).json(savedWord);
  } catch (error) {
    console.error("Save word error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Remove a word from user's list
router.post("/api/auth/wordlist/remove", async (req, res) => {
  try {
    const { userId, wordId } = req.body;
    
    if (!userId || !wordId) {
      return res.status(400).json({ message: "User ID and Word ID are required" });
    }
    
    await storage.removeWordFromUserList(userId, wordId);
    return res.status(200).json({ message: "Word removed from list" });
  } catch (error) {
    console.error("Remove word error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;