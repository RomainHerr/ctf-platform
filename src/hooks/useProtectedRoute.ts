"use client";

/**
 * Protected Route Hook
 * 
 * This hook provides route protection functionality for client-side navigation.
 * It redirects unauthenticated or unverified users to appropriate pages.
 * 
 * SECURITY NOTES:
 * - This is a client-side guard only
 * - Server-side protection via API routes is still required
 * - Always verify tokens on the server for sensitive operations
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface UseProtectedRouteOptions {
  requireEmailVerified?: boolean;
  redirectTo?: string;
  adminOnly?: boolean;
}

interface UseProtectedRouteResult {
  isAuthorized: boolean;
  isLoading: boolean;
}

/**
 * Hook to protect routes requiring authentication
 * 
 * @param options - Configuration options
 * @returns Authorization status
 */
export function useProtectedRoute(
  options: UseProtectedRouteOptions = {}
): UseProtectedRouteResult {
  const {
    requireEmailVerified = true,
    redirectTo = "/auth/login",
    adminOnly = false,
  } = options;

  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Not authenticated
    if (!user) {
      router.replace(redirectTo);
      return;
    }

    // Email not verified (when required)
    if (requireEmailVerified && !user.emailVerified) {
      router.replace("/auth/verify-email");
      return;
    }

    // Admin check
    if (adminOnly && !userData?.isAdmin) {
      router.replace("/");
      return;
    }

    // User is banned
    if (userData?.isBanned) {
      router.replace("/auth/banned");
      return;
    }
  }, [user, userData, loading, requireEmailVerified, adminOnly, redirectTo, router]);

  const isAuthorized: boolean =
    !loading &&
    !!user &&
    (!requireEmailVerified || user.emailVerified) &&
    (!adminOnly || (userData?.isAdmin ?? false)) &&
    !(userData?.isBanned ?? false);

  return {
    isAuthorized,
    isLoading: loading,
  };
}
