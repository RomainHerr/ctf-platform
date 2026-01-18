/**
 * Public User Profile API Route
 * 
 * GET /api/user/[uid] - Fetch public profile of a user
 * 
 * SECURITY:
 * - Requires authentication
 * - Returns only public user data (no email, no sensitive info)
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

interface ChallengeInfo {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
}

interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  rank: number | null;
  solvedChallenges: ChallengeInfo[];
  cheatedChallenges: ChallengeInfo[];
  joinedAt: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
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
    const { uid } = await params;

    if (!uid || typeof uid !== "string") {
      return errorResponse("Invalid user ID", 400);
    }

    // Fetch user document
    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return errorResponse("User not found", 404);
    }

    const userData = userDoc.data();

    if (!userData) {
      return errorResponse("User data not found", 404);
    }

    // Check if user is banned
    if (userData.isBanned) {
      return errorResponse("User not found", 404);
    }

    // Get solved challenges details
    const solvedChallengeIds: string[] = userData.solvedChallenges || [];
    const solvedChallenges: PublicProfile["solvedChallenges"] = [];

    if (solvedChallengeIds.length > 0) {
      // Fetch challenge details for each solved challenge
      const challengePromises = solvedChallengeIds.map((challengeId) =>
        adminDb.collection("challenges").doc(challengeId).get()
      );

      const challengeDocs = await Promise.all(challengePromises);

      for (const doc of challengeDocs) {
        if (doc.exists) {
          const challengeData = doc.data();
          if (challengeData) {
            solvedChallenges.push({
              id: doc.id,
              title: challengeData.title,
              category: challengeData.category,
              difficulty: challengeData.difficulty,
              points: challengeData.points,
            });
          }
        }
      }

      // Sort by points (highest first)
      solvedChallenges.sort((a, b) => b.points - a.points);
    }

    // Get cheated challenges details
    const cheatedChallengeIds: string[] = userData.cheatedChallenges || [];
    const cheatedChallenges: ChallengeInfo[] = [];

    if (cheatedChallengeIds.length > 0) {
      const cheatPromises = cheatedChallengeIds.map((challengeId) =>
        adminDb.collection("challenges").doc(challengeId).get()
      );

      const cheatDocs = await Promise.all(cheatPromises);

      for (const doc of cheatDocs) {
        if (doc.exists) {
          const challengeData = doc.data();
          if (challengeData) {
            cheatedChallenges.push({
              id: doc.id,
              title: challengeData.title,
              category: challengeData.category,
              difficulty: challengeData.difficulty,
              points: challengeData.points,
            });
          }
        }
      }

      cheatedChallenges.sort((a, b) => b.points - a.points);
    }

    // Calculate rank
    let rank: number | null = null;
    if (userData.score > 0) {
      const higherScoreCount = await adminDb
        .collection("users")
        .where("score", ">", userData.score)
        .count()
        .get();
      rank = higherScoreCount.data().count + 1;
    }

    // Build public profile
    const publicProfile: PublicProfile = {
      uid: userDoc.id,
      displayName: userData.displayName || "Anonymous",
      photoURL: userData.photoURL || null,
      score: userData.score || 0,
      rank,
      solvedChallenges,
      cheatedChallenges,
      joinedAt: userData.createdAt?.toDate?.()?.toISOString() || null,
    };

    return successResponse(publicProfile);
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return errorResponse("Failed to fetch user profile", 500);
  }
}
