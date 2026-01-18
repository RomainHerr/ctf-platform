# CTF Platform - Secure Cybersecurity Training Platform

A production-ready Capture The Flag (CTF) platform built with Next.js 15, TypeScript, and Firebase. This platform provides a secure environment for cybersecurity training through hands-on challenges.

## Team

- Romain Herrenknecht
- Stanislas Thibaud
- Gaspard Auclair
- Mael Tellus
- Romain Oualid

---

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (copy and fill .env.local)
cp env.example.txt .env.local

# Generate challenge files
npm run generate-files

# Seed challenges to Firestore
npm run seed

# Start development server
npm run dev
```

---

## Features

### Core Features
- Multi-user CTF competition platform
- User registration with Email/Password, Google, and GitHub OAuth
- Email verification required before accessing challenges
- Challenge submission with automatic server-side verification
- Scoring based on difficulty (Easy: 100, Medium: 250, Hard: 500, Expert: 1000, Insane: 2000)
- Real-time leaderboard with public player profiles
- Challenge filtering by category and difficulty

### Special Features
- **Coming Soon Challenges**: Displayed with reduced opacity, not yet solvable
- **"I Want to Cheat" Button**: Pedagogical feature that reveals solutions but permanently records on user profile (Wall of Shame)
- **Public Profiles**: View other players' solved challenges and stats

### Security Features
- Server-side flag verification only
- Flags stored as salted SHA-256 hashes
- Timing-safe hash comparison
- Rate limiting on all sensitive endpoints
- Firebase ID token verification on every API request
- Firestore Security Rules as defense-in-depth
- Generic error messages to prevent enumeration

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Authentication | Firebase Auth |
| Database | Firestore |
| Backend Logic | Next.js API Routes |
| Deployment | Vercel |

---

## Project Structure

```
ctf-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (server-side)
│   │   │   ├── challenges/    # Challenge CRUD + submit + cheat
│   │   │   ├── leaderboard/   # Leaderboard endpoint
│   │   │   └── user/          # User profile endpoints
│   │   ├── auth/              # Auth pages (login, register, verify)
│   │   ├── challenges/        # Challenge list and detail pages
│   │   ├── leaderboard/       # Leaderboard page
│   │   └── profile/           # User profile pages
│   ├── components/            # React components
│   ├── contexts/              # React contexts (AuthContext)
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utility libraries
│   │   ├── firebase.ts       # Client Firebase config
│   │   ├── firebase-admin.ts # Server Firebase Admin config
│   │   ├── security.ts       # Security utilities
│   │   ├── rate-limiter.ts   # Rate limiting logic
│   │   └── api-utils.ts      # API helper functions
│   └── types/                 # TypeScript definitions
├── scripts/                   # Utility scripts
├── public/challenges/         # Challenge attachment files
├── firestore.rules           # Firestore security rules
└── public/Reports/           # PDF deliverables (presentation + report)
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run seed` | Seed challenges to Firestore |
| `npm run clear-challenges` | Delete all challenges from Firestore |
| `npm run reset-challenges` | Clear + Seed (full reset) |
| `npm run generate-files` | Generate challenge attachment files |
| `npm run reset-user -- email` | Reset a specific user's progress |
| `npm run reset-all-users` | Reset all users' progress |

---

## Environment Variables

Create a `.env.local` file with:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security
FLAG_HASH_SALT=your-minimum-32-character-random-string
```

---

## Firebase Setup

### 1. Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com)
- Create a new project

### 2. Enable Authentication
- Firebase Console > Authentication > Sign-in method
- Enable: Email/Password, Google, GitHub

### 3. Create Firestore Database
- Firebase Console > Firestore Database > Create database
- Start in production mode

### 4. Deploy Security Rules
Copy these rules to Firebase Console > Firestore > Rules:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isEmailVerified() {
      return request.auth != null && request.auth.token.email_verified == true;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if false;
    }
    
    match /challenges/{challengeId} {
      allow read: if isAuthenticated() && isEmailVerified();
      allow create, update, delete: if false;
    }
    
    match /submissions/{submissionId} {
      allow read: if isAuthenticated() && isEmailVerified() && resource.data.userId == request.auth.uid;
      allow create, update, delete: if false;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 5. Get Admin SDK Credentials
- Firebase Console > Project Settings > Service accounts
- Generate new private key
- Copy values to `.env.local`

---

## Challenges

### Active Challenges (10)

| Challenge | Category | Difficulty | Points |
|-----------|----------|------------|--------|
| ROT13 Rookie | Crypto | Easy | 100 |
| Base64 Basics | Crypto | Easy | 100 |
| Hex Madness | Crypto | Easy | 100 |
| RSA Weakling | Crypto | Hard | 500 |
| Hidden Pixels | Forensics | Easy | 100 |
| String Theory | Reverse | Easy | 100 |
| Assembly Puzzle | Reverse | Medium | 250 |
| Buffer Overflow 101 | PWN | Medium | 250 |
| QR Quest | Misc | Easy | 100 |
| Network Detective | Misc | Medium | 250 |

### Coming Soon Challenges (10)

| Challenge | Category | Difficulty | Points |
|-----------|----------|------------|--------|
| JWT Juggling | Web | Expert | 1000 |
| GraphQL Introspection | Web | Expert | 1000 |
| Elliptic Curve Nightmare | Crypto | Insane | 2000 |
| Homomorphic Heist | Crypto | Insane | 2000 |
| Kernel Panic | PWN | Insane | 2000 |
| Heap Feng Shui | PWN | Insane | 2000 |
| VM Escape | Reverse | Expert | 1000 |
| Neural Network Backdoor | Reverse | Insane | 2000 |
| Memory Corruption | Forensics | Expert | 1000 |
| Blockchain Forensics | Forensics | Expert | 1000 |

---

## API Endpoints

All protected endpoints require:
```
Authorization: Bearer <firebase-id-token>
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/challenges` | List all challenges |
| GET | `/api/challenges/[id]` | Get single challenge |
| POST | `/api/challenges/submit` | Submit flag |
| POST | `/api/challenges/cheat` | Get solution (recorded) |
| GET | `/api/leaderboard` | Get leaderboard |
| GET | `/api/user/profile` | Get own profile |
| GET | `/api/user/[uid]` | Get public profile |

---

## Security Architecture

### Trust Model
- **Client**: Untrusted - handles UI only
- **API Routes**: Trusted - all critical logic
- **Firestore Rules**: Defense-in-depth

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| Flag submission | 5/min |
| Authentication | 10/min |
| General API | 100/min |

### Flag Verification Flow
1. Receive flag from authenticated user
2. Normalize: `trim().toLowerCase()`
3. Hash: `SHA256(SALT + flag)`
4. Compare with stored hash (timing-safe)
5. Update score via atomic transaction
6. Log submission
7. Return generic response

---

## OWASP Top 10 Coverage

| Vulnerability | Mitigation |
|---------------|------------|
| A01 Broken Access Control | Server-side token verification, Firestore rules |
| A02 Cryptographic Failures | SHA-256 + salt, HTTPS, env vars for secrets |
| A03 Injection | NoSQL (Firestore), input sanitization |
| A04 Insecure Design | Server-side validation, defense-in-depth |
| A05 Security Misconfiguration | Security headers, default deny rules |
| A06 Vulnerable Components | Up-to-date dependencies |
| A07 Auth Failures | Strong password policy, rate limiting |
| A08 Data Integrity | Atomic transactions, server-side scoring |
| A09 Logging Failures | Security event logging |
| A10 SSRF | No user-controlled external requests |

---

## Deployment (Vercel)

1. Connect GitHub repository to Vercel
2. Add all environment variables
3. Deploy:
   ```bash
   vercel --prod
   ```
4. Update Firebase authorized domains

---

## Documentation

PDF deliverables are available in `public/Reports/` and accessible via the website footer:
- **Presentation**: Slide deck for oral defense
- **Report**: Written academic report

---

## License

Academic project - ISEP Cybersecurity Course, January 2026.
