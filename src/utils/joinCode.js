import { customAlphabet } from 'nanoid';
import { env } from '../config/env.js';

// Use uppercase letters and numbers, exclude confusing characters (0, O, I, 1, l)
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const generateCode = customAlphabet(alphabet, env.JOIN_CODE_LENGTH);

/**
 * Generate a unique join code for sessions
 * @returns {string} Uppercase alphanumeric code
 */
export function generateJoinCode() {
  return generateCode();
}