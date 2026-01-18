/**
 * API Utilities Module
 * 
 * This module provides helper functions for API route handlers.
 * It includes authentication verification, error handling, and
 * response formatting utilities.
 * 
 * SECURITY FEATURES:
 * - Firebase ID token verification
 * - Email verification check
 * - Consistent error responses (prevent information leakage)
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";
import { hashIpAddress, GENERIC_ERRORS } from "./security";
import {
  checkRateLimit,
  createRateLimitHeaders,
  RateLimitResult,
  RATE_LIMIT_CONFIGS,
} from "./rate-limiter";
import { ApiResponse, User } from "@/types";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * Verified user context from authentication
 */
export interface AuthenticatedContext {
  user: DecodedIdToken;
  userData: User | null;
  ipHash: string;
}

/**
 * Extracts the client IP address from the request.
 * Handles various proxy headers commonly used in production.
 * 
 * @param request - Next.js request object
 * @returns Client IP address
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers used by proxies/load balancers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Get the first IP in the chain (original client)
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
  }

  // Fallback - this may not be accurate behind proxies
  return "unknown";
}

/**
 * Extracts and verifies the Firebase ID token from the request.
 * 
 * @param request - Next.js request object
 * @returns Decoded token or null if invalid
 */
export async function verifyAuthToken(
  request: NextRequest
): Promise<DecodedIdToken | null> {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify the token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Authenticates a request and returns the user context.
 * Checks both token validity and email verification.
 * 
 * @param request - Next.js request object
 * @param requireEmailVerified - Whether to require email verification
 * @returns Authenticated context or error response
 */
export async function authenticateRequest(
  request: NextRequest,
  requireEmailVerified: boolean = true
): Promise<AuthenticatedContext | NextResponse<ApiResponse>> {
  const decodedToken = await verifyAuthToken(request);
  
  if (!decodedToken) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: GENERIC_ERRORS.UNAUTHORIZED,
      },
      { status: 401 }
    );
  }

  // Check email verification
  if (requireEmailVerified && !decodedToken.email_verified) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: GENERIC_ERRORS.EMAIL_NOT_VERIFIED,
      },
      { status: 403 }
    );
  }

  // Get user data from Firestore
  const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
  const userData = userDoc.exists ? (userDoc.data() as User) : null;

  // Check if user is banned
  if (userData?.isBanned) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: GENERIC_ERRORS.UNAUTHORIZED,
      },
      { status: 403 }
    );
  }

  const ipHash = hashIpAddress(getClientIp(request));

  return {
    user: decodedToken,
    userData,
    ipHash,
  };
}

/**
 * Applies rate limiting to a request.
 * 
 * @param request - Next.js request object
 * @param configKey - Rate limit configuration key
 * @param identifier - Optional custom identifier (defaults to IP hash)
 * @returns Rate limit result and identifier
 */
export function applyRateLimit(
  request: NextRequest,
  configKey: keyof typeof RATE_LIMIT_CONFIGS,
  identifier?: string
): { result: RateLimitResult; identifier: string } {
  const ip = getClientIp(request);
  const ipHash = hashIpAddress(ip);
  const finalIdentifier = identifier || ipHash;
  const config = RATE_LIMIT_CONFIGS[configKey];
  
  const result = checkRateLimit(`${configKey}:${finalIdentifier}`, config);
  
  return { result, identifier: finalIdentifier };
}

/**
 * Creates a rate-limited error response.
 * 
 * @param result - Rate limit result
 * @returns NextResponse with appropriate headers
 */
export function rateLimitedResponse(
  result: RateLimitResult
): NextResponse<ApiResponse> {
  const headers = createRateLimitHeaders(result);
  
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: GENERIC_ERRORS.RATE_LIMITED,
    },
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Creates a successful API response.
 * 
 * @param data - Response data
 * @param message - Optional success message
 * @returns NextResponse
 */
export function successResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    message,
  });
}

/**
 * Creates an error API response.
 * 
 * @param error - Error message
 * @param status - HTTP status code
 * @returns NextResponse
 */
export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Validates request body against expected structure.
 * Returns parsed JSON or error response.
 * 
 * @param request - Next.js request object
 * @returns Parsed body or error response
 */
export async function parseRequestBody<T>(
  request: NextRequest
): Promise<T | NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    return errorResponse("Invalid request body", 400);
  }
}

/**
 * Logs security events for auditing.
 * In production, send these to a logging service.
 * 
 * @param event - Event type
 * @param data - Event data
 */
export function logSecurityEvent(
  event: string,
  data: Record<string, unknown>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };

  // In production, send to logging service (e.g., LogRocket, Sentry)
  console.log("[SECURITY]", JSON.stringify(logEntry));
}
