import { Request, Response, NextFunction } from "express";

/**
 * requireAuth
 * 
 * Middleware to protect routes. Checks if user is authenticated via Passport.
 * Returns 401 Unauthorized if no active session exists.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    res.status(401).json({ 
        message: "Authentication required. Please log in.",
        status: 401 
    });
}
