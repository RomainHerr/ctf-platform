/**
 * User Profile API Route
 * 
 * GET /api/user/profile - Get current user's profile
 * PATCH /api/user/profile - Update user's profile
 * 
 * SECURITY:
 * - Requires authentication
 * - Input sanitization
 * - Rate limited
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
  AuthenticatedContext,
} from "@/lib/api-utils";
import { sanitizeDisplayName, GENERIC_ERRORS } from "@/lib/security";
import { UserPublic } from "@/types";

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const { result: rateLimit } = applyRateLimit(request, "general");
  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit);
  }

  // Authenticate request
  const authResult = await authenticateRequest(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user, userData } = authResult as AuthenticatedContext;

  if (!userData) {
    return errorResponse(GENERIC_ERRORS.NOT_FOUND, 404);
  }

  // Calculate user's rank
  const higherScoreCount = await adminDb
    .collection("users")
    .where("score", ">", userData.score)
    .where("isBanned", "==", false)
    .count()
    .get();

  const rank = higherScoreCount.data().count + 1;

  const profile: UserPublic = {
    uid: user.uid,
    displayName: userData.displayName,
    score: userData.score,
    solvedChallenges: userData.solvedChallenges,
    rank,
  };

  return successResponse(profile);
}

interface UpdateProfileRequest {
  displayName?: string;
}

export async function PATCH(request: NextRequest) {
  // Apply rate limiting
  const { result: rateLimit } = applyRateLimit(request, "general");
  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit);
  }

  // Authenticate request
  const authResult = await authenticateRequest(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user } = authResult as AuthenticatedContext;

  // Parse request body
  const bodyResult = await parseRequestBody<UpdateProfileRequest>(request);
  if (bodyResult instanceof Response) {
    return bodyResult;
  }

  const { displayName } = bodyResult;

  try {
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) {
      const sanitized = sanitizeDisplayName(displayName);
      if (sanitized.length < 2) {
        return errorResponse(
          "Display name must be at least 2 characters",
          400
        );
      }
      updates.displayName = sanitized;
    }

    await adminDb.collection("users").doc(user.uid).update(updates);

    return successResponse({ updated: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return errorResponse(GENERIC_ERRORS.SERVER_ERROR, 500);
  }
}
