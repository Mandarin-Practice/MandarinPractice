import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { storage } from 'server/storage';

// Custom request property to store authenticated user ID
declare global {
  namespace Express {
    interface Request {
      authenticatedUserId?: number;
      user?: {
        firebaseUid: string;
        email?: string;
      };
    }
  }
}

/**
 * Middleware to check if user is authenticated
 * This can be used to protect routes that require authentication
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check for user ID in query or body
  const userIdFromQuery = req.query.userId ? parseInt(req.query.userId as string) : undefined;
  const userIdFromBody = req.body?.userId ? parseInt(req.body.userId as string) : undefined;
  
  // Get user ID from any available source
  const userId = userIdFromQuery || userIdFromBody;
  
  if (!userId) {
    return res.status(401).json({ 
      message: "Authentication required", 
      code: "AUTH_REQUIRED" 
    });
  }
  
  // Store user ID in request for other middleware/route handlers
  req.authenticatedUserId = userId;
  
  // Continue to the next middleware or route handler
  next();
};

// Middleware for Firebase authentication
export const verifyFirebaseToken = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("\nNO TOKEN PROVIDED\n");
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

export const firebaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "User authentication required" });
  }

  const user = await storage.getUserByFirebaseUid(req.user.firebaseUid);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  req.authenticatedUserId = user.id;

  next();
}

/**
 * Middleware to optionally get user ID if available
 * This allows routes to work both for authenticated and unauthenticated users
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check for user ID in query or body
  const userIdFromQuery = req.query.userId ? parseInt(req.query.userId as string) : undefined;
  const userIdFromBody = req.body?.userId ? parseInt(req.body.userId as string) : undefined;
  
  // Get user ID from any available source
  const userId = userIdFromQuery || userIdFromBody;
  
  if (userId) {
    // Store user ID in request for other middleware/route handlers
    req.authenticatedUserId = userId;
  }
  
  // Continue to the next middleware or route handler
  next();
};