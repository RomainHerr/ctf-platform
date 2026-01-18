/**
 * Challenges API Route
 * 
 * GET /api/challenges - Fetch all active challenges
 * 
 * SECURITY:
 * - Requires authentication
 * - Requires email verification
 * - Rate limited
 * - Flags are NEVER returned to client
 */

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  authenticateRequest,
  applyRateLimit,
  rateLimitedResponse,
  successResponse,
  errorResponse,
  AuthenticatedContext,
} from "@/lib/api-utils";
import { Challenge, ChallengePublic } from "@/types";

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const { result: rateLimit, identifier } = applyRateLimit(request, "general");
  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit);
  }

  // Authenticate request
  const authResult = await authenticateRequest(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user, userData } = authResult as AuthenticatedContext;

  try {
    // Fetch active challenges
    const challengesSnapshot = await adminDb
      .collection("challenges")
      .where("isActive", "==", true)
      .orderBy("category")
      .orderBy("difficulty")
      .get();

    // Get user's solved challenges
    const solvedChallenges = userData?.solvedChallenges || [];

    // Transform to public format (excluding flag hash)
    const challenges: ChallengePublic[] = challengesSnapshot.docs.map((doc) => {
      const data = doc.data() as Challenge;
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        points: data.points,
        hints: data.hints,
        attachments: data.attachments,
        solveCount: data.solveCount,
        isSolved: solvedChallenges.includes(doc.id),
      };
    });

    return successResponse(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return errorResponse("Failed to fetch challenges", 500);
  }
}
