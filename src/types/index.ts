/**
 * Type Definitions for CTF Platform
 * 
 * This module contains all TypeScript interfaces and types used throughout
 * the application. Using strict types ensures data integrity and provides
 * compile-time validation.
 */

import { Timestamp } from "firebase/firestore";

// ============================================
// User Types
// ============================================

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  score: number;
  solvedChallenges: string[]; // Array of challengeIds
  rank: number | null;
  isAdmin: boolean;
  isBanned: boolean;
  lastLoginAt: Timestamp;
}

export interface UserPublic {
  uid: string;
  displayName: string | null;
  score: number;
  solvedChallenges: string[];
  rank: number | null;
}

export interface CreateUserData {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// ============================================
// Challenge Types
// ============================================

export type ChallengeDifficulty = "easy" | "medium" | "hard" | "expert";

export type ChallengeCategory =
  | "web"
  | "crypto"
  | "forensics"
  | "reverse"
  | "pwn"
  | "misc"
  | "osint";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  flagHash: string; // Salted SHA-256 hash of the flag
  hints: string[];
  attachments: ChallengeAttachment[];
  solveCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  author: string;
}

export interface ChallengeAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ChallengePublic {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  hints: string[];
  attachments: ChallengeAttachment[];
  solveCount: number;
  isSolved: boolean; // Contextual to current user
}

// ============================================
// Submission Types
// ============================================

export type SubmissionStatus = "correct" | "incorrect" | "rate_limited";

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  submittedAt: Timestamp;
  status: SubmissionStatus;
  ipAddress: string; // Hashed for privacy
  userAgent: string;
}

export interface SubmissionRequest {
  challengeId: string;
  flag: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  pointsAwarded?: number;
  newScore?: number;
}

// ============================================
// Leaderboard Types
// ============================================

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string | null;
  score: number;
  solvedCount: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ============================================
// Authentication Types
// ============================================

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

// ============================================
// Rate Limiting Types
// ============================================

export interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidation extends ValidationResult {
  strength: "weak" | "fair" | "strong" | "very_strong";
}

// ============================================
// Difficulty Points Mapping
// ============================================

export const DIFFICULTY_POINTS: Record<ChallengeDifficulty, number> = {
  easy: 100,
  medium: 250,
  hard: 500,
  expert: 1000,
} as const;

// ============================================
// Category Display Names
// ============================================

export const CATEGORY_NAMES: Record<ChallengeCategory, string> = {
  web: "Web Exploitation",
  crypto: "Cryptography",
  forensics: "Digital Forensics",
  reverse: "Reverse Engineering",
  pwn: "Binary Exploitation",
  misc: "Miscellaneous",
  osint: "Open Source Intelligence",
} as const;
