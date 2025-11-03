import { verifyToken, extractToken } from '../utils/jwt.js';
import { AuthenticationError } from '../utils/errors.js';
import { organizerRepository } from '../repositories/organizer.repository.js';

/**
 * Middleware to authenticate requests using JWT
 * Attaches organizer object to req.organizer
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      throw new AuthenticationError('No token provided. Please log in.');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get organizer from database
    const organizer = await organizerRepository.findById(decoded.id);
    
    if (!organizer) {
      throw new AuthenticationError('Organizer not found. Please log in again.');
    }

    // Attach organizer to request (without password)
    req.organizer = {
      id: organizer.id,
      email: organizer.email,
      name: organizer.name,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Used for routes that can work with or without auth
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      const organizer = await organizerRepository.findById(decoded.id);
      
      if (organizer) {
        req.organizer = {
          id: organizer.id,
          email: organizer.email,
          name: organizer.name,
        };
      }
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}