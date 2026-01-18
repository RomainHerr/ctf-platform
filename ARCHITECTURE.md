# Architecture Documentation

## Security Architecture

This document provides detailed technical documentation of the security architecture implemented in the CTF platform.

---

## 1. Authentication Architecture

### 1.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │     │   Firebase   │     │   Next.js    │     │   Firestore  │
│  (React) │     │     Auth     │     │  API Routes  │     │   Database   │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                    │                    │
     │  1. Login Request│                    │                    │
     │─────────────────>│                    │                    │
     │                  │                    │                    │
     │  2. ID Token     │                    │                    │
     │<─────────────────│                    │                    │
     │                  │                    │                    │
     │  3. API Request + Bearer Token        │                    │
     │──────────────────────────────────────>│                    │
     │                  │                    │                    │
     │                  │  4. Verify Token   │                    │
     │                  │<───────────────────│                    │
     │                  │                    │                    │
     │                  │  5. Token Valid    │                    │
     │                  │───────────────────>│                    │
     │                  │                    │                    │
     │                  │                    │  6. Query Data     │
     │                  │                    │───────────────────>│
     │                  │                    │                    │
     │                  │                    │  7. Data Response  │
     │                  │                    │<───────────────────│
     │                  │                    │                    │
     │  8. API Response │                    │                    │
     │<──────────────────────────────────────│                    │
     │                  │                    │                    │
```

### 1.2 Token Verification

Every API request is verified using the Firebase Admin SDK:

```typescript
// Token verification (server-side only)
const decodedToken = await adminAuth.verifyIdToken(token, true);

// The second parameter (true) enables check for revoked tokens
```

**Security Benefits:**
- Tokens are cryptographically signed by Firebase
- Token expiration is enforced (1 hour by default)
- Revoked tokens are detected (e.g., after password change)

### 1.3 Email Verification Enforcement

```typescript
// Check during authentication
if (requireEmailVerified && !decodedToken.email_verified) {
  return NextResponse.json(
    { success: false, error: "Email not verified" },
    { status: 403 }
  );
}
```

**Rationale:**
- Prevents account creation with temporary email services
- Ensures ability to contact users about security issues
- Reduces spam and abuse

---

## 2. Flag Security Architecture

### 2.1 Flag Storage

Flags are NEVER stored in plaintext. The storage process:

```
Original Flag: CTF{example_flag}
        │
        ▼
┌───────────────────────────┐
│   Normalize (lowercase)   │
│   "ctf{example_flag}"     │
└───────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│   Concatenate with Salt   │
│   SALT + normalized_flag  │
└───────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│      SHA-256 Hash         │
│   "a1b2c3d4e5f6..."      │
└───────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│   Store in Firestore      │
│   (flagHash field)        │
└───────────────────────────┘
```

### 2.2 Flag Validation

```typescript
function validateFlag(submittedFlag: string, storedHash: string): boolean {
  // 1. Hash the submitted flag
  const submittedHash = hashFlag(submittedFlag);
  
  // 2. Convert to buffers for timing-safe comparison
  const submittedBuffer = Buffer.from(submittedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  // 3. Length check (prevents timing attack on length difference)
  if (submittedBuffer.length !== storedBuffer.length) {
    return false;
  }

  // 4. Timing-safe comparison
  return timingSafeEqual(submittedBuffer, storedBuffer);
}
```

**Why Timing-Safe Comparison?**

A regular comparison (`===`) exits early on first mismatch, creating timing differences:

```
Hash A: a1b2c3d4...
Hash B: a1b2c3d5...  // Different at position 7
        ^^^^^^^
        Same (fast)

Regular comparison: ~7 iterations before false
```

An attacker could measure response times to guess the hash character by character. `timingSafeEqual` always compares all bytes, taking constant time.

---

## 3. Rate Limiting Architecture

### 3.1 Sliding Window Algorithm

```
Time ──────────────────────────────────────────────────────>
      │                                                    │
      │◄───────────────── 60 seconds ────────────────────►│
      │                                                    │
Request 1    Request 2    Request 3    Request 4    Request 5    Request 6
    ●            ●            ●            ●            ●            ✗
    │            │            │            │            │            │
    └────────────┴────────────┴────────────┴────────────┴────────────┘
                    All 5 allowed                        Blocked
```

### 3.2 Rate Limit Configuration

```typescript
const RATE_LIMIT_CONFIGS = {
  flagSubmission: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,            // 5 attempts
  },
  authentication: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,           // 10 attempts
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,            // 3 attempts
  },
};
```

### 3.3 Identifier Strategy

Rate limiting uses a combination of:
1. **IP Address Hash**: Prevents IP enumeration while still limiting
2. **User ID**: For authenticated requests, limits per user

```typescript
const rateLimitKey = `${ipHash}:${user.uid}`;
```

This prevents:
- Anonymous abuse (limited by IP)
- Authenticated abuse (limited by user + IP)
- IP rotation attacks (user still limited)

---

## 4. Defense-in-Depth Architecture

### 4.1 Multiple Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LAYER 1: CSP                                    │
│  Content Security Policy prevents XSS, clickjacking                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                           LAYER 2: Rate Limiting                            │
│  Prevents brute force, DoS attacks                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                         LAYER 3: Authentication                             │
│  Firebase Auth token verification                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                       LAYER 4: Authorization                                │
│  Email verification, ban check, role check                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                         LAYER 5: Input Validation                           │
│  Sanitization, type checking, length limits                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                      LAYER 6: Business Logic                                │
│  Server-side validation, atomic transactions                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                     LAYER 7: Firestore Rules                                │
│  Defense-in-depth, prevents direct database manipulation                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Why Multiple Layers?

Each layer addresses different attack vectors:

| Layer | Protects Against |
|-------|------------------|
| CSP | XSS, clickjacking, code injection |
| Rate Limiting | Brute force, DoS |
| Authentication | Unauthorized access |
| Authorization | Privilege escalation |
| Input Validation | Injection attacks |
| Business Logic | Logic flaws |
| Firestore Rules | Direct DB attacks |

---

## 5. Transaction Security

### 5.1 Atomic Score Updates

```typescript
await adminDb.runTransaction(async (transaction) => {
  // 1. Read current user data
  const userDoc = await transaction.get(userRef);
  const currentSolved = userDoc.data()?.solvedChallenges || [];
  
  // 2. Double-check not already solved (race condition protection)
  if (currentSolved.includes(challengeId)) {
    return; // Abort - already solved
  }

  // 3. Update user score
  transaction.update(userRef, {
    score: newScore,
    solvedChallenges: FieldValue.arrayUnion(challengeId),
  });

  // 4. Update challenge solve count
  transaction.update(challengeRef, {
    solveCount: FieldValue.increment(1),
  });
});
```

**Why Transactions?**

Without transactions, a race condition could occur:

```
User submits flag twice simultaneously:

Request A                        Request B
    │                                │
    ▼                                ▼
Check solved? NO                 Check solved? NO
    │                                │
    ▼                                ▼
Add points (+100)                Add points (+100)
    │                                │
    ▼                                ▼
Final score: +200 (should be +100!)
```

Transactions ensure atomicity - either all operations succeed or none do.

---

## 6. Firestore Security Rules

### 6.1 Rule Philosophy

```
DEFAULT: DENY ALL
    │
    ▼
EXPLICIT ALLOW for:
    │
    ├── Authenticated users reading challenges (excluding flagHash)
    ├── Authenticated users reading their own profile
    ├── Authenticated users reading leaderboard data
    └── Users updating ONLY their displayName
```

### 6.2 Critical Rule: Flag Hash Protection

```javascript
match /challenges/{challengeId} {
  // Note: This rule allows read, but the client SDK
  // should NEVER query for flagHash field
  allow read: if isAuthenticated() && 
    isEmailVerified() &&
    resource.data.isActive == true;
}
```

**Defense Strategy:**
1. API Routes never include flagHash in responses
2. Client SDK queries never request flagHash
3. Even if rules are misconfigured, the field name (flagHash) is not obvious

---

## 7. Logging and Monitoring

### 7.1 Security Events Logged

```typescript
logSecurityEvent("FLAG_SUBMISSION", {
  userId: user.uid,
  challengeId,
  ipHash,        // Hashed for privacy
  correct: isCorrect,
});
```

Events tracked:
- Authentication attempts (success/failure)
- Rate limit violations
- Flag submissions (correct/incorrect)
- Profile updates
- Suspicious activity patterns

### 7.2 Privacy Considerations

- IP addresses are hashed before logging
- User agents are truncated
- Passwords are never logged
- PII is minimized

---

## 8. Error Handling

### 8.1 Generic Error Messages

```typescript
const GENERIC_ERRORS = {
  AUTH_FAILED: "Authentication failed. Please check your credentials.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  // Never reveals if email exists or not
};
```

**Why Generic Messages?**

Specific error messages enable user enumeration:

```
// BAD: Reveals email exists
"Password incorrect for user@example.com"

// GOOD: No information leakage
"Invalid email or password."
```

### 8.2 Error Propagation

```
Client Error ◄── Generic Message ◄── Sanitized ◄── Detailed Server Error
                                          │
                                          ▼
                                    Logged internally
```

---

## 9. Deployment Security

### 9.1 Environment Variable Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES                         │
├─────────────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_*        │ Exposed to client (safe)                 │
│                      │ - Firebase API key                       │
│                      │ - Auth domain                            │
├──────────────────────┼──────────────────────────────────────────┤
│ Server-only          │ Never exposed (sensitive)                │
│                      │ - Admin SDK credentials                  │
│                      │ - FLAG_HASH_SALT                         │
└──────────────────────┴──────────────────────────────────────────┘
```

### 9.2 HTTPS Enforcement

```typescript
// HSTS Header
{
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains",
}
```

Browsers will:
1. Automatically upgrade HTTP to HTTPS
2. Remember this preference for 1 year
3. Apply to all subdomains

---

## 10. Future Security Improvements

### 10.1 Recommended Enhancements

1. **Redis for Rate Limiting**: Distributed rate limiting for multiple instances
2. **Web Application Firewall**: Additional protection layer
3. **Anomaly Detection**: ML-based suspicious activity detection
4. **Bug Bounty Program**: Incentivize security research
5. **Regular Security Audits**: Penetration testing

### 10.2 Monitoring Recommendations

1. Set up alerts for:
   - High rate limit violation rates
   - Unusual flag submission patterns
   - Authentication failures spikes
   - Error rate increases

2. Regular log review for security incidents

---

## Conclusion

This architecture prioritizes security through:
- Multiple defense layers
- Cryptographically secure flag handling
- Comprehensive access control
- Audit logging
- Standard security best practices

Each design decision balances security with usability, ensuring a robust platform for cybersecurity training.
