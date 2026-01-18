/**
 * Single Challenge API Route
 * 
 * GET /api/challenges/[id] - Fetch a single challenge by ID
 * 
 * SECURITY:
 * - Requires authentication
 * - Requires email verification
 * - Rate limited
 * - Flag hash is NEVER returned
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
import { GENERIC_ERRORS } from "@/lib/security";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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

  const { userData } = authResult as AuthenticatedContext;

  try {
    // Fetch challenge
    const challengeDoc = await adminDb.collection("challenges").doc(id).get();

    if (!challengeDoc.exists) {
      return errorResponse(GENERIC_ERRORS.NOT_FOUND, 404);
    }

    const data = challengeDoc.data() as Challenge;

    // Check if challenge is active
    if (!data.isActive) {
      return errorResponse(GENERIC_ERRORS.NOT_FOUND, 404);
    }

    // Get user's solved challenges
    const solvedChallenges = userData?.solvedChallenges || [];

    // Transform to public format
    const challenge: ChallengePublic = {
      id: challengeDoc.id,
      title: data.title,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      points: data.points,
      hints: data.hints,
      attachments: data.attachments,
      solveCount: data.solveCount,
      isSolved: solvedChallenges.includes(challengeDoc.id),
      isComingSoon: data.isComingSoon || false,
    };

    return successResponse(challenge);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return errorResponse("Failed to fetch challenge", 500);
  }
}
