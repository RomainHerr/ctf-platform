/**
 * Security Utilities Module
 * 
 * This module provides cryptographic functions and security utilities
 * for the CTF platform. All flag validation happens server-side only.
 * 
 * SECURITY CONSIDERATIONS:
 * - Flags are stored as salted SHA-256 hashes
 * - Timing-safe comparison prevents timing attacks
 * - Rate limiting prevents brute-force attacks
 * - Input sanitization prevents injection attacks
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { PasswordValidation, ValidationResult } from "@/types";

// ============================================
// Flag Hashing and Validation
// ============================================

/**
 * Creates a salted SHA-256 hash of a flag.
 * Used when storing flags in the database.
 * 
 * @param flag - The plaintext flag to hash
 * @returns The salted hash of the flag
 */
export function hashFlag(flag: string): string {
  const salt = process.env.FLAG_HASH_SALT;
  if (!salt) {
    throw new Error("FLAG_HASH_SALT environment variable is not set");
  }

  // Normalize flag: trim whitespace and convert to lowercase
  const normalizedFlag = flag.trim().toLowerCase();
  
  // Create salted hash using SHA-256
  const hash = createHash("sha256")
    .update(salt + normalizedFlag)
    .digest("hex");

  return hash;
}

/**
 * Validates a submitted flag against the stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 * 
 * @param submittedFlag - The flag submitted by the user
 * @param storedHash - The hash stored in the database
 * @returns True if the flag is correct
 */
export function validateFlag(submittedFlag: string, storedHash: string): boolean {
  const submittedHash = hashFlag(submittedFlag);
  
  // Convert to buffers for timing-safe comparison
  const submittedBuffer = Buffer.from(submittedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  // Timing-safe comparison prevents timing attacks
  if (submittedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(submittedBuffer, storedBuffer);
}

// ============================================
// Password Validation
// ============================================

/**
 * Password requirements for the platform.
 * Follows OWASP recommendations for password strength.
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSymbol: true,
  symbols: "!@#$%^&*()_+-=[]{}|;':\",./<>?`~",
} as const;

/**
 * Validates password strength according to security requirements.
 * 
 * @param password - The password to validate
 * @returns Validation result with strength assessment
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let strength: PasswordValidation["strength"] = "weak";
  let score = 0;

  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
    );
  } else {
    score += 1;
    if (password.length >= 16) score += 1;
    if (password.length >= 20) score += 1;
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(
      `Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`
    );
  }

  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // Digit check
  if (PASSWORD_REQUIREMENTS.requireDigit && !/\d/.test(password)) {
    errors.push("Password must contain at least one digit");
  } else if (/\d/.test(password)) {
    score += 1;
  }

  // Symbol check
  const symbolRegex = new RegExp(
    `[${PASSWORD_REQUIREMENTS.symbols.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`
  );
  if (PASSWORD_REQUIREMENTS.requireSymbol && !symbolRegex.test(password)) {
    errors.push("Password must contain at least one special character");
  } else if (symbolRegex.test(password)) {
    score += 1;
  }

  // Common password patterns (basic check)
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push("Password contains a common pattern that is easily guessed");
      score = Math.max(0, score - 2);
      break;
    }
  }

  // Determine strength based on score
  if (score >= 7) {
    strength = "very_strong";
  } else if (score >= 5) {
    strength = "strong";
  } else if (score >= 3) {
    strength = "fair";
  } else {
    strength = "weak";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

// ============================================
// Email Validation
// ============================================

/**
 * Validates email format using RFC 5322 compliant regex.
 * 
 * @param email - The email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  // RFC 5322 compliant email regex (simplified but effective)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  } else if (email.length > 254) {
    errors.push("Email exceeds maximum length");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitizes user input to prevent XSS and injection attacks.
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .slice(0, 10000); // Limit length
}

/**
 * Sanitizes display name with stricter rules.
 * 
 * @param name - The display name to sanitize
 * @returns Sanitized display name
 */
export function sanitizeDisplayName(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  return name
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, "") // Only allow alphanumeric, underscore, hyphen, space
    .slice(0, 50); // Limit to 50 characters
}

// ============================================
// Rate Limiting Utilities
// ============================================

/**
 * Generates a hash of the IP address for privacy-preserving rate limiting.
 * 
 * @param ip - The IP address to hash
 * @returns Hashed IP address
 */
export function hashIpAddress(ip: string): string {
  const salt = process.env.FLAG_HASH_SALT || "default-salt";
  return createHash("sha256")
    .update(salt + ip)
    .digest("hex")
    .slice(0, 16); // Use first 16 chars for storage efficiency
}

/**
 * Generates a cryptographically secure random token.
 * 
 * @param length - Length of the token in bytes (default 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

// ============================================
// Generic Error Messages
// ============================================

/**
 * Generic error messages to prevent information leakage.
 * Using consistent messages prevents user enumeration attacks.
 */
export const GENERIC_ERRORS = {
  AUTH_FAILED: "Authentication failed. Please check your credentials.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before continuing.",
  RATE_LIMITED: "Too many requests. Please try again later.",
  SERVER_ERROR: "An unexpected error occurred. Please try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_FAILED: "Validation failed. Please check your input.",
  FLAG_INCORRECT: "Incorrect flag. Keep trying!",
  FLAG_CORRECT: "Correct! Challenge solved.",
  ALREADY_SOLVED: "You have already solved this challenge.",
} as const;
