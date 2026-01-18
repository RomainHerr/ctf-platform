/**
 * Flag Submission API Route
 * 
 * POST /api/challenges/submit - Submit a flag for verification
 * 
 * SECURITY CRITICAL:
 * - Strict rate limiting (5 attempts per minute)
 * - Server-side flag validation only
 * - Timing-safe comparison to prevent timing attacks
 * - Logs all submission attempts for audit
 * - Prevents duplicate submissions
 */

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  authenticateRequest,
  applyRateLimit,
  rateLimitedResponse,
  successResponse,
  errorResponse,
  parseRequestBody,
  logSecurityEvent,
  AuthenticatedContext,
  getClientIp,
} from "@/lib/api-utils";
import {
  validateFlag,
  sanitizeInput,
  hashIpAddress,
  GENERIC_ERRORS,
} from "@/lib/security";
import { Challenge, SubmissionRequest } from "@/types";

export async function POST(request: NextRequest) {
  // Get IP for logging and rate limiting
  const clientIp = getClientIp(request);
  const ipHash = hashIpAddress(clientIp);

  // Authenticate request first
  const authResult = await authenticateRequest(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user, userData } = authResult as AuthenticatedContext;

  // Apply strict rate limiting for flag submission
  // Use combination of IP and user ID for rate limiting
  const rateLimitKey = `${ipHash}:${user.uid}`;
  const { result: rateLimit } = applyRateLimit(
    request,
    "flagSubmission",
    rateLimitKey
  );

  if (!rateLimit.allowed) {
    logSecurityEvent("RATE_LIMITED_FLAG_SUBMISSION", {
      userId: user.uid,
      ipHash,
      remaining: rateLimit.remaining,
    });
    return rateLimitedResponse(rateLimit);
  }

  // Parse request body
  const bodyResult = await parseRequestBody<SubmissionRequest>(request);
  if (bodyResult instanceof Response) {
    return bodyResult;
  }

  const { challengeId, flag } = bodyResult;

  // Validate input
  if (!challengeId || typeof challengeId !== "string") {
    return errorResponse(GENERIC_ERRORS.VALIDATION_FAILED, 400);
  }

  if (!flag || typeof flag !== "string") {
    return errorResponse(GENERIC_ERRORS.VALIDATION_FAILED, 400);
  }

  // Sanitize flag input
  const sanitizedFlag = sanitizeInput(flag);
  if (sanitizedFlag.length === 0 || sanitizedFlag.length > 256) {
    return errorResponse(GENERIC_ERRORS.VALIDATION_FAILED, 400);
  }

  try {
    // Check if already solved
    if (userData?.solvedChallenges?.includes(challengeId)) {
      return successResponse(
        {
          correct: false,
          message: GENERIC_ERRORS.ALREADY_SOLVED,
        },
        GENERIC_ERRORS.ALREADY_SOLVED
      );
    }

    // Fetch challenge
    const challengeDoc = await adminDb
      .collection("challenges")
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      return errorResponse(GENERIC_ERRORS.NOT_FOUND, 404);
    }

    const challenge = challengeDoc.data() as Challenge;

    if (!challenge.isActive) {
      return errorResponse(GENERIC_ERRORS.NOT_FOUND, 404);
    }

    // Validate flag using timing-safe comparison
    const isCorrect = validateFlag(sanitizedFlag, challenge.flagHash);

    // Log submission attempt
    const userAgent = request.headers.get("user-agent") || "unknown";
    
    // Create submission record
    const submissionData = {
      challengeId,
      userId: user.uid,
      submittedAt: FieldValue.serverTimestamp(),
      status: isCorrect ? "correct" : "incorrect",
      ipAddress: ipHash, // Store hashed IP for privacy
      userAgent: userAgent.slice(0, 256), // Truncate user agent
    };

    await adminDb.collection("submissions").add(submissionData);

    // Log security event
    logSecurityEvent("FLAG_SUBMISSION", {
      userId: user.uid,
      challengeId,
      ipHash,
      correct: isCorrect,
    });

    if (isCorrect) {
      // Use transaction for atomic update
      await adminDb.runTransaction(async (transaction) => {
        // Update user document
        const userRef = adminDb.collection("users").doc(user.uid);
        const userDoc = await transaction.get(userRef);
        
        let currentUserData = userDoc.data();
        let currentSolved: string[] = [];
        
        // Create user document if it doesn't exist
        if (!userDoc.exists) {
          currentUserData = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.name || user.email?.split("@")[0] || "Anonymous",
            photoURL: user.picture || null,
            emailVerified: user.email_verified || false,
            score: 0,
            solvedChallenges: [],
            rank: null,
            isAdmin: false,
            isBanned: false,
          };
          transaction.set(userRef, {
            ...currentUserData,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            lastLoginAt: FieldValue.serverTimestamp(),
          });
        } else {
          currentSolved = currentUserData?.solvedChallenges || [];
        }
        
        // Double-check not already solved (race condition protection)
        if (currentSolved.includes(challengeId)) {
          return;
        }

        const newScore = (currentUserData?.score || 0) + challenge.points;

        transaction.update(userRef, {
          score: newScore,
          solvedChallenges: FieldValue.arrayUnion(challengeId),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Update challenge solve count
        const challengeRef = adminDb.collection("challenges").doc(challengeId);
        transaction.update(challengeRef, {
          solveCount: FieldValue.increment(1),
        });
      });

      // Get updated user data for response
      const updatedUserDoc = await adminDb
        .collection("users")
        .doc(user.uid)
        .get();
      const updatedUserData = updatedUserDoc.data();

      return successResponse({
        correct: true,
        message: GENERIC_ERRORS.FLAG_CORRECT,
        pointsAwarded: challenge.points,
        newScore: updatedUserData?.score || 0,
      });
    } else {
      return successResponse({
        correct: false,
        message: GENERIC_ERRORS.FLAG_INCORRECT,
      });
    }
  } catch (error) {
    console.error("Error processing flag submission:", error);
    logSecurityEvent("FLAG_SUBMISSION_ERROR", {
      userId: user.uid,
      challengeId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return errorResponse(GENERIC_ERRORS.SERVER_ERROR, 500);
  }
}
