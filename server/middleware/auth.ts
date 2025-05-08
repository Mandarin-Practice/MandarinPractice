import { Request, Response, NextFunction } from 'express';

// Custom request property to store authenticated user ID
declare global {
  namespace Express {
    interface Request {
      authenticatedUserId?: number;
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