"use client";

/**
 * API Hook
 * 
 * This hook provides a typed interface for making authenticated API requests.
 * It automatically handles token attachment and error responses.
 */

import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiResponse } from "@/types";

interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  execute: (
    endpoint: string,
    options?: RequestInit
  ) => Promise<ApiResponse<T> | null>;
}

/**
 * Hook for making authenticated API requests
 */
export function useApi<T = unknown>(): UseApiResult<T> {
  const { getIdToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const execute = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ): Promise<ApiResponse<T> | null> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getIdToken();

        if (!token) {
          setError("Authentication required");
          return null;
        }

        const response = await fetch(endpoint, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        });

        const result: ApiResponse<T> = await response.json();

        if (!result.success) {
          setError(result.error || "An error occurred");
          return result;
        }

        setData(result.data || null);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getIdToken]
  );

  return { data, error, loading, execute };
}

/**
 * Specialized hook for flag submission
 */
export function useSubmitFlag() {
  const { execute, loading, error } = useApi<{
    correct: boolean;
    message: string;
    pointsAwarded?: number;
    newScore?: number;
  }>();

  const submitFlag = useCallback(
    async (challengeId: string, flag: string) => {
      return execute("/api/challenges/submit", {
        method: "POST",
        body: JSON.stringify({ challengeId, flag }),
      });
    },
    [execute]
  );

  return { submitFlag, loading, error };
}
