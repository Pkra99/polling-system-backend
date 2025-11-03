import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { organizerRepository } from '../repositories/organizer.repository.js';
import { 
  AuthenticationError, 
  ConflictError, 
  ValidationError 
} from '../utils/errors.js';

export const authService = {
  /**
   * Register a new organizer
   */
  async register({ email, password, name }) {
    // Check if email already exists
    const existingOrganizer = await organizerRepository.findByEmail(email);
    if (existingOrganizer) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organizer
    const organizer = await organizerRepository.create({
      email,
      passwordHash,
      name,
    });

    // Generate JWT token
    const token = signToken({
      id: organizer.id,
      email: organizer.email,
    });

    // Return organizer data (without password) and token
    return {
      organizer: {
        id: organizer.id,
        email: organizer.email,
        name: organizer.name,
        createdAt: organizer.createdAt,
      },
      token,
    };
  },

  /**
   * Login organizer
   */
  async login({ email, password }) {
    // Find organizer by email
    const organizer = await organizerRepository.findByEmail(email);
    if (!organizer) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, organizer.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token
    const token = signToken({
      id: organizer.id,
      email: organizer.email,
    });

    // Return organizer data (without password) and token
    return {
      organizer: {
        id: organizer.id,
        email: organizer.email,
        name: organizer.name,
        createdAt: organizer.createdAt,
      },
      token,
    };
  },

  /**
   * Get organizer by ID
   */
  async getOrganizerById(id) {
    const organizer = await organizerRepository.findById(id);
    if (!organizer) {
      throw new AuthenticationError('Organizer not found');
    }

    return {
      id: organizer.id,
      email: organizer.email,
      name: organizer.name,
      createdAt: organizer.createdAt,
    };
  },
};