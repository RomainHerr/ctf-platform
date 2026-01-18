# CTF Platform - Cybersecurity Training Platform

A production-ready Capture The Flag (CTF) platform built with Next.js, TypeScript, and Firebase. This platform provides a secure environment for cybersecurity training through hands-on challenges.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Security Features](#security-features)
4. [OWASP Top 10 Mapping](#owasp-top-10-mapping)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Deployment](#deployment)
8. [API Documentation](#api-documentation)
9. [Data Model](#data-model)

---

## Architecture Overview

### High-Level Architecture

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Client Browser  |<--->|  Next.js Server  |<--->|    Firebase      |
|  (React/Next.js) |     |  (API Routes)    |     |  (Auth + Firestore)
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
        |                        |
        |  Firebase Auth SDK     |  Firebase Admin SDK
        |  (Client-side)         |  (Server-side)
        v                        v
+------------------+     +------------------+
|                  |     |                  |
|  Authentication  |     |  Secure Backend  |
|  (OAuth + Email) |     |  Operations      |
|                  |     |                  |
+------------------+     +------------------+
```

### Request Flow

1. **Authentication Flow**
   - User authenticates via Firebase Auth (Email/Password or OAuth)
   - Firebase issues an ID token (JWT)
   - Client includes token in Authorization header for API requests
   - Server verifies token using Firebase Admin SDK

2. **Flag Submission Flow**
   ```
   Client -> POST /api/challenges/submit -> Rate Limit Check -> Token Verification
                                                                      |
                                                                      v
                                                            Email Verification Check
                                                                      |
                                                                      v
                                                            Flag Hash Comparison
                                                            (Timing-Safe)
                                                                      |
                                                                      v
                                                            Update Score (Transaction)
                                                                      |
                                                                      v
                                                            Response to Client
   ```

### Directory Structure

```
ctf-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API Routes (server-side)
│   │   │   ├── challenges/    # Challenge endpoints
│   │   │   ├── leaderboard/   # Leaderboard endpoint
│   │   │   └── user/          # User profile endpoint
│   │   ├── auth/              # Authentication pages
│   │   ├── challenges/        # Challenge pages
│   │   ├── leaderboard/       # Leaderboard page
│   │   └── profile/           # User profile page
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # Reusable UI components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utility libraries
│   │   ├── firebase.ts       # Client Firebase config
│   │   ├── firebase-admin.ts # Server Firebase Admin config
│   │   ├── security.ts       # Security utilities
│   │   ├── rate-limiter.ts   # Rate limiting logic
│   │   └── api-utils.ts      # API helper functions
│   └── types/                 # TypeScript definitions
├── scripts/                   # Utility scripts
├── firestore.rules           # Firestore security rules
└── next.config.ts            # Next.js configuration
```

---

## Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Frontend Framework | Next.js 14 (App Router) | SSR, API Routes, TypeScript support |
| Language | TypeScript (strict) | Type safety, compile-time error detection |
| Styling | Tailwind CSS | Utility-first, responsive design |
| Authentication | Firebase Auth | OAuth support, secure token management |
| Database | Firestore | Real-time sync, security rules |
| Backend Logic | Next.js API Routes | Server-side validation, no Cloud Functions needed |
| Deployment | Vercel | Optimized for Next.js, edge functions |

---

## Security Features

### 1. Authentication Security

- **Strong Password Policy**: Minimum 12 characters, requires uppercase, lowercase, digit, and symbol
- **Email Verification Required**: Users must verify email before accessing protected features
- **Generic Error Messages**: Prevents user enumeration attacks
- **OAuth Integration**: Secure third-party authentication (Google, GitHub)

### 2. Authorization Security

- **Token Verification**: All API requests verified using Firebase Admin SDK
- **Email Verification Check**: Protected routes require verified email
- **Role-Based Access**: Admin-only features protected
- **Ban System**: Ability to ban malicious users

### 3. Data Security

- **Flag Hashing**: Flags stored as salted SHA-256 hashes
- **Timing-Safe Comparison**: Prevents timing attacks on flag validation
- **Input Sanitization**: All user input sanitized before processing
- **No Sensitive Data Exposure**: Flag hashes never sent to client

### 4. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Flag Submission | 5 requests | 1 minute |
| Authentication | 10 requests | 15 minutes |
| Password Reset | 3 requests | 1 hour |
| General API | 60 requests | 1 minute |

### 5. HTTP Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [comprehensive policy]
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 6. Firestore Security Rules

- Read-only access for challenges (excluding flagHash)
- Users can only modify their display name
- Score updates only via Admin SDK (API Routes)
- Submissions cannot be created by clients

---

## OWASP Top 10 Mapping

### A01:2021 - Broken Access Control

**Mitigations Implemented:**
- Server-side token verification on all protected endpoints
- Email verification requirement for sensitive operations
- Firestore security rules as defense-in-depth
- User can only access their own profile data

**Code Location:** `src/lib/api-utils.ts` - `authenticateRequest()`

### A02:2021 - Cryptographic Failures

**Mitigations Implemented:**
- Flags stored as salted SHA-256 hashes
- Sensitive data (FLAG_HASH_SALT, Admin SDK keys) stored in environment variables
- HTTPS enforced via HSTS header
- No plaintext sensitive data in database

**Code Location:** `src/lib/security.ts` - `hashFlag()`, `validateFlag()`

### A03:2021 - Injection

**Mitigations Implemented:**
- Firestore ORM prevents SQL injection (NoSQL database)
- Input sanitization for all user inputs
- Parameterized queries throughout
- Content Security Policy prevents XSS

**Code Location:** `src/lib/security.ts` - `sanitizeInput()`, `sanitizeDisplayName()`

### A04:2021 - Insecure Design

**Mitigations Implemented:**
- Flag validation entirely server-side
- Defense-in-depth architecture (API Routes + Firestore Rules)
- Rate limiting prevents abuse
- Atomic transactions for score updates

**Code Location:** `src/app/api/challenges/submit/route.ts`

### A05:2021 - Security Misconfiguration

**Mitigations Implemented:**
- Security headers configured in `next.config.ts`
- Default deny in Firestore rules
- Minimal permissions approach
- No debug information in production errors

**Code Location:** `next.config.ts`, `firestore.rules`

### A06:2021 - Vulnerable and Outdated Components

**Mitigations Implemented:**
- Regular dependency updates
- Package version pinning in package.json
- Using maintained frameworks (Next.js, Firebase)

**Code Location:** `package.json`

### A07:2021 - Identification and Authentication Failures

**Mitigations Implemented:**
- Strong password policy (12+ chars, complexity requirements)
- Rate limiting on authentication attempts
- Generic error messages prevent enumeration
- Multi-factor authentication support via OAuth

**Code Location:** `src/lib/security.ts` - `validatePassword()`

### A08:2021 - Software and Data Integrity Failures

**Mitigations Implemented:**
- Server-side validation for all critical operations
- Atomic transactions for data updates
- Score cannot be modified directly by clients

**Code Location:** `src/app/api/challenges/submit/route.ts` - Transaction usage

### A09:2021 - Security Logging and Monitoring Failures

**Mitigations Implemented:**
- Security event logging for all critical operations
- Rate limit violations logged
- Flag submission attempts logged with metadata

**Code Location:** `src/lib/api-utils.ts` - `logSecurityEvent()`

### A10:2021 - Server-Side Request Forgery (SSRF)

**Mitigations Implemented:**
- No user-controlled URLs processed server-side
- External requests only to Firebase APIs
- Content Security Policy restricts connections

---

## Installation

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Firebase project with Authentication and Firestore enabled
- Firebase service account credentials

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ctf-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file based on `env.example.txt`:
   ```bash
   cp env.example.txt .env.local
   ```

4. **Configure Firebase**
   - Enable Email/Password authentication
   - Enable Google OAuth provider
   - Enable GitHub OAuth provider
   - Create Firestore database
   - Deploy Firestore security rules

5. **Seed initial challenges**
   ```bash
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client API key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `FIREBASE_ADMIN_PROJECT_ID` | Admin SDK project ID | Yes |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Admin SDK service account email | Yes |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Admin SDK private key | Yes |
| `FLAG_HASH_SALT` | Salt for flag hashing (min 32 chars) | Yes |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No |

### Firebase Configuration

1. **Enable Authentication Providers**
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (configure OAuth consent screen)
   - Enable GitHub (configure OAuth app on GitHub)

2. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Create Indexes** (if needed for queries)
   - Firebase Console > Firestore > Indexes

---

## Deployment

### Vercel Deployment

1. **Connect Repository**
   - Link GitHub repository to Vercel

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Firebase Configuration for Production

1. **Update Authorized Domains**
   - Firebase Console > Authentication > Settings > Authorized domains
   - Add your production domain

2. **Update OAuth Redirect URIs**
   - Google Cloud Console: Update authorized redirect URIs
   - GitHub Developer Settings: Update callback URL

---

## API Documentation

### Authentication

All protected endpoints require:
```
Authorization: Bearer <firebase-id-token>
```

### Endpoints

#### GET /api/challenges
Fetch all active challenges (flags excluded)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Challenge Name",
      "description": "...",
      "category": "web",
      "difficulty": "medium",
      "points": 250,
      "hints": ["..."],
      "attachments": [],
      "solveCount": 42,
      "isSolved": false
    }
  ]
}
```

#### GET /api/challenges/[id]
Fetch single challenge details

#### POST /api/challenges/submit
Submit a flag for verification

**Request:**
```json
{
  "challengeId": "abc123",
  "flag": "CTF{your_flag}"
}
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "correct": true,
    "message": "Correct! Challenge solved.",
    "pointsAwarded": 250,
    "newScore": 500
  }
}
```

#### GET /api/leaderboard
Fetch global leaderboard

#### GET /api/user/profile
Fetch current user profile

#### PATCH /api/user/profile
Update user display name

---

## Data Model

### Users Collection (`/users/{uid}`)

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  score: number;
  solvedChallenges: string[];
  rank: number | null;
  isAdmin: boolean;
  isBanned: boolean;
  lastLoginAt: Timestamp;
}
```

### Challenges Collection (`/challenges/{challengeId}`)

```typescript
interface Challenge {
  id: string;
  title: string;
  description: string;
  category: "web" | "crypto" | "forensics" | "reverse" | "pwn" | "misc" | "osint";
  difficulty: "easy" | "medium" | "hard" | "expert";
  points: number;
  flagHash: string; // NEVER exposed to client
  hints: string[];
  attachments: ChallengeAttachment[];
  solveCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  author: string;
}
```

### Submissions Collection (`/submissions/{submissionId}`)

```typescript
interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  submittedAt: Timestamp;
  status: "correct" | "incorrect" | "rate_limited";
  ipAddress: string; // Hashed
  userAgent: string;
}
```

---

## License

This project is developed for academic purposes as part of a cybersecurity curriculum.

---

## Security Contact

For security vulnerabilities, please contact the development team directly. Do not open public issues for security concerns.
