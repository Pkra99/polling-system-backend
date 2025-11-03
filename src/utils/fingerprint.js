import crypto from 'crypto';

/**
 * Generate a unique fingerprint for a participant
 * Combines IP address, User-Agent, and session ID
 * 
 * @param {string} ip - Client IP address
 * @param {string} userAgent - Client User-Agent string
 * @param {string} sessionId - Session ID
 * @returns {string} SHA-256 hash fingerprint
 */
export function generateFingerprint(ip, userAgent, sessionId) {
  const data = `${ip}:${userAgent}:${sessionId}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Extract client IP address from request
 * Handles proxy and load balancer scenarios
 * 
 * @param {object} req - Express request object
 * @returns {string} Client IP address
 */
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Extract User-Agent from request
 * 
 * @param {object} req - Express request object
 * @returns {string} User-Agent string
 */
export function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}
