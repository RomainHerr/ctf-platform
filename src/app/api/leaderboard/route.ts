/**
 * Leaderboard API Route
 * 
 * GET /api/leaderboard - Fetch the leaderboard
 * 
 * SECURITY:
 * - Requires authentication
 * - Requires email verification
 * - Rate limited
 * - Returns only public user data
 */

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  authenticateRequest,
  applyRateLimit,
  rateLimitedResponse,
  successResponse,
  errorResponse,
} from "@/lib/api-utils";
import { LeaderboardEntry } from "@/types";

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

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      100
    );

    // Fetch top users by score
    const usersSnapshot = await adminDb
      .collection("users")
      .where("isBanned", "==", false)
      .where("score", ">", 0)
      .orderBy("score", "desc")
      .limit(limit)
      .get();

    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = usersSnapshot.docs.map(
      (doc, index) => {
        const data = doc.data();
        return {
          rank: index + 1,
          uid: doc.id,
          displayName: data.displayName || "Anonymous",
          score: data.score || 0,
          solvedCount: data.solvedChallenges?.length || 0,
        };
      }
    );

    return successResponse(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return errorResponse("Failed to fetch leaderboard", 500);
  }
}
