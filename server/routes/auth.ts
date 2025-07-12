import { Request, Response, Router } from "express";
import { storage } from "../storage";
import admin from "firebase-admin";
import { insertUserSchema } from "@shared/schema";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

// Password hashing functions
async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = randomBytes(16).toString("hex");

  // Hash the password with the salt
  const hash = createHash("sha256");
  hash.update(password + salt);
  const hashedPassword = hash.digest("hex");

  // Return the salt and hashed password together
  return `${salt}:${hashedPassword}`;
}

async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  try {
    // Extract the salt and hash from the stored password
    const [salt, hash] = storedPassword.split(":");

    // Hash the provided password with the same salt
    const providedHash = createHash("sha256")
      .update(password + salt)
      .digest("hex");

    // Compare the hashes using a timing-safe comparison
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(providedHash, "hex"));
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

// Initialize Firebase Admin with service account credentials if available
let firebaseInitialized = false;
try {
  if (!admin.apps.length && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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
export const verifyFirebaseToken = async (req: Request, res: Response, next: Function) => {
  console.log("Verifying Firebase token...");
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

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const printSmthn = async (req: Request, res: Response, next: Function) => {
  console.log("Middleware printSmthn called");
  next();
}

export const requireFirebaseUser = async (req: Request, res: Response, next: Function) => {
  console.log("Requiring firebase user...");
  if (!req.user?.firebaseUid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    req.authenticatedUserId = user.id;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Database error" });
  }
};

export const authenticateFirebaseUser = [verifyFirebaseToken, requireFirebaseUser];

// Standard username/password registration
authRouter.post("/register/local", async (req: Request, res: Response) => {
  try {
    const { username, password, email, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if email already exists if provided
    if (email) {
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Hash the password (in a real app, use a proper password hashing library like bcrypt)
    // For this example, we're using a simple hash function
    const hashedPassword = await hashPassword(password);

    // Validate input using Zod schema
    const userData = insertUserSchema.parse({
      username,
      password: hashedPassword,
      email,
      displayName: displayName || username,
    });

    // Create new user
    const newUser = await storage.createUser(userData);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error registering user:", error);
    res.status(400).json({ error: error.message || "Failed to register user" });
  }
});

// Login with username/password
authRouter.post("/login/local", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Verify password (in a real app, use proper password verification)
    const passwordMatches = await verifyPassword(password, user.password || "");
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: error.message || "Failed to login" });
  }
});

// Register or login a user with Firebase
authRouter.post("/register", verifyFirebaseToken, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "User authentication required" });
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
    console.error("Error registering user:", error);
    res.status(400).json({ error: error.message || "Failed to register user" });
  }
});

// Get current user data
authRouter.get("/user", verifyFirebaseToken, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "User authentication required" });
  }

  try {
    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error: any) {
    console.error("Error getting user data:", error);
    res.status(500).json({ error: error.message || "Failed to get user data" });
  }
});

// Get user by ID (used for local authentication)
authRouter.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await storage.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error getting user data:", error);
    res.status(500).json({ error: error.message || "Failed to get user data" });
  }
});

// Update user profile for Firebase users
authRouter.patch("/user", verifyFirebaseToken, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "User authentication required" });
  }

  try {
    const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user data
    const updatedUser = await storage.updateUser(user.id, req.body);

    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user data:", error);
    res.status(500).json({ error: error.message || "Failed to update user data" });
  }
});

// Update user profile for local authentication users
authRouter.patch("/user/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await storage.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user data
    const updatedUser = await storage.updateUser(userId, req.body);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error updating user data:", error);
    res.status(500).json({ error: error.message || "Failed to update user data" });
  }
});

export default authRouter;
