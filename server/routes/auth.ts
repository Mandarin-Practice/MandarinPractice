import { Request, Response, Router } from "express";
import { storage } from "../storage";
import admin from "firebase-admin";
import { insertUserSchema } from "@shared/schema";

// Initialize Firebase Admin with service account credentials if available
let firebaseInitialized = false;
try {
  if (!admin.apps.length && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log("Firebase Admin SDK initialized successfully");
  } else {
    console.log("Firebase Admin SDK not initialized - missing credentials");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

const authRouter = Router();

// Add user property to Express.Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        firebaseUid: string;
        email?: string;
      };
    }
  }
}

// Middleware for Firebase authentication 
const verifyFirebaseToken = async (req: Request, res: Response, next: Function) => {
  // If Firebase is not initialized, use mock verification for development
  if (!firebaseInitialized) {
    console.log("Firebase not initialized, using mock verification");
    req.user = {
      firebaseUid: "mock-uid",
      email: "mock@example.com",
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Register or login a user
authRouter.post('/register', verifyFirebaseToken, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User authentication required' });
  }
  
  try {
    // First, check if user already exists
    const existingUser = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    if (existingUser) {
      // User exists, return the user data
      return res.status(200).json(existingUser);
    }
    
    // Validate input using Zod schema
    const userData = insertUserSchema.parse({
      ...req.body,
      firebaseUid: req.user.firebaseUid,
      email: req.user.email || req.body.email,
    });
    
    // Create new user
    const newUser = await storage.createUser(userData);
    
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(400).json({ error: error.message || 'Failed to register user' });
  }
});

// Get current user data
authRouter.get('/user', verifyFirebaseToken, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User authentication required' });
  }
  
  try {
    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error: any) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: error.message || 'Failed to get user data' });
  }
});

// Update user profile
authRouter.patch('/user', verifyFirebaseToken, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User authentication required' });
  }
  
  try {
    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user data
    const updatedUser = await storage.updateUser(user.id, req.body);
    
    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user data:', error);
    res.status(500).json({ error: error.message || 'Failed to update user data' });
  }
});

// Get user's word list
authRouter.get('/wordlist', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }
    
    // Get user's word proficiencies
    const proficiencies = await storage.getUserWordProficiencies(userId);
    
    // Filter only saved words
    const savedWords = proficiencies.filter(prof => prof.isSaved);
    
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
    
    res.status(200).json(filteredWordList);
  } catch (error: any) {
    console.error('Error getting user word list:', error);
    res.status(500).json({ error: error.message || 'Failed to get user word list' });
  }
});

// Add word to user's list
authRouter.post('/wordlist', async (req: Request, res: Response) => {
  try {
    const { userId, wordId } = req.body;
    
    if (!userId || !wordId) {
      return res.status(400).json({ error: 'userId and wordId are required' });
    }
    
    // Save word to user's list
    const result = await storage.saveWordToUserList(userId, wordId);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error adding word to list:', error);
    res.status(500).json({ error: error.message || 'Failed to add word to list' });
  }
});

// Remove word from user's list
authRouter.delete('/wordlist', async (req: Request, res: Response) => {
  try {
    const { userId, wordId } = req.body;
    
    if (!userId || !wordId) {
      return res.status(400).json({ error: 'userId and wordId are required' });
    }
    
    // Remove word from user's list
    await storage.removeWordFromUserList(userId, wordId);
    
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error removing word from list:', error);
    res.status(500).json({ error: error.message || 'Failed to remove word from list' });
  }
});

export default authRouter;