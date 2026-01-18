/**
 * Cheat API Route
 * 
 * POST /api/challenges/cheat - Mark a challenge as cheated and get the solution
 * 
 * SECURITY:
 * - Requires authentication
 * - Requires email verification
 * - Rate limited
 * - Records cheat in user profile permanently
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
} from "@/lib/api-utils";

// Hardcoded solutions (in production, store these securely)
const CHALLENGE_SOLUTIONS: Record<string, { flag: string; explanation: string }> = {
  "ROT13 Rookie": {
    flag: "ctf{rotate_me_baby_one_more_time}",
    explanation: "ROT13 decodes 'pgs{ebgngr_zr_onol_bar_zber_gvzr}' by shifting each letter 13 positions back in the alphabet.",
  },
  "Base64 Basics": {
    flag: "ctf{base64_is_not_encryption}",
    explanation: "Base64 decode 'Y3Rme2Jhc2U2NF9pc19ub3RfZW5jcnlwdGlvbn0=' to get the flag.",
  },
  "RSA Weakling": {
    flag: "ctf{small_n_is_weak}",
    explanation: "Factor n=323 into 17*19, compute phi(n)=288, find d=173, then decrypt c=245.",
  },
  "Hex Madness": {
    flag: "ctf{hex_is_just_base16}",
    explanation: "Convert hex '6374667b6865785f69735f6a7573745f62617365313666' to ASCII.",
  },
  "Hidden Pixels": {
    flag: "ctf{steganography_101}",
    explanation: "Use 'strings hidden.png | grep ctf' or 'exiftool hidden.png' to find the flag in metadata.",
  },
  "String Theory": {
    flag: "ctf{strings_command_ftw}",
    explanation: "Run 'strings crackme1 | grep ctf' to extract readable strings from the binary.",
  },
  "Assembly Puzzle": {
    flag: "ctf{xor_for_the_win}",
    explanation: "Calculate 0xDEAD XOR 0x1337 = 0xCD9A. The flag format is the answer to the puzzle.",
  },
  "Buffer Overflow 101": {
    flag: "ctf{smashing_the_stack_for_fun}",
    explanation: "Read vuln.c source code - the flag is in the secret_function().",
  },
  "QR Quest": {
    flag: "ctf{qr_error_correction_rocks}",
    explanation: "Scan the QR code with any phone scanner - it still works due to error correction level H.",
  },
  "Network Detective": {
    flag: "ctf{wireshark_is_essential}",
    explanation: "Run 'strings capture.pcap | grep ctf' to find the flag in the X-Secret-Flag HTTP header.",
  },
};

export async function POST(request: NextRequest) {
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
  const { user } = authResult;

  try {
    const body = await request.json();
    const { challengeId } = body;

    if (!challengeId) {
      return errorResponse("Challenge ID is required", 400);
    }

    // Fetch challenge
    const challengeDoc = await adminDb
      .collection("challenges")
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      return errorResponse("Challenge not found", 404);
    }

    const challenge = challengeDoc.data();
    if (!challenge) {
      return errorResponse("Challenge data not found", 404);
    }

    // Get solution
    const solution = CHALLENGE_SOLUTIONS[challenge.title];
    if (!solution) {
      return errorResponse("Solution not available for this challenge", 404);
    }

    // Record cheat in user profile
    const userRef = adminDb.collection("users").doc(user.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      await userRef.update({
        cheatedChallenges: FieldValue.arrayUnion(challengeId),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Create user document if it doesn't exist
      await userRef.set({
        uid: user.uid,
        email: user.email || "",
        displayName: user.name || user.email?.split("@")[0] || "Anonymous",
        photoURL: user.picture || null,
        emailVerified: user.email_verified || false,
        score: 0,
        solvedChallenges: [],
        cheatedChallenges: [challengeId],
        rank: null,
        isAdmin: false,
        isBanned: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      });
    }

    // Log the cheat event
    console.log(`[CHEAT] User ${user.uid} cheated on challenge ${challengeId} (${challenge.title})`);

    return successResponse({
      flag: solution.flag,
      explanation: solution.explanation,
      message: "This cheat has been recorded on your profile.",
    });
  } catch (error) {
    console.error("Error processing cheat request:", error);
    return errorResponse("Failed to process cheat request", 500);
  }
}
