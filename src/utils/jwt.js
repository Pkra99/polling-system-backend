import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthenticationError } from './errors.js';

/**
 * Sign a JWT token
 * @param {object} payload - Data to encode in token
 * @param {string} expiresIn - Expiry time (default from env)
 * @returns {string} Signed JWT token
 */
export function signToken(payload, expiresIn = env.JWT_EXPIRY) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
    issuer: 'polling-platform',
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'polling-platform',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired. Please log in again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token. Please log in again.');
    }
    throw new AuthenticationError('Authentication failed.');
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}