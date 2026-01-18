"use client";

/**
 * Leaderboard Page
 * 
 * Displays the global leaderboard with player rankings.
 * Protected route - requires authentication and email verification.
 */

import React, { useState, useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import { Card, LoadingSpinner, Alert } from "@/components/ui";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { LeaderboardEntry } from "@/types";

export default function LeaderboardPage(): React.ReactElement {
  const { isAuthorized, isLoading: authLoading } = useProtectedRoute();
  const { userData } = useAuth();
  const { execute, loading, error } = useApi<LeaderboardEntry[]>();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Fetch leaderboard
  useEffect(() => {
    if (isAuthorized) {
      fetchLeaderboard();
    }
  }, [isAuthorized]);

  const fetchLeaderboard = async () => {
    const result = await execute("/api/leaderboard?limit=100");
    if (result?.success && result.data) {
      setLeaderboard(result.data);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthorized) {
    return <></>;
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case 2:
        return "bg-gray-400/20 text-gray-300 border-gray-400/30";
      case 3:
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-cyber-border/50 text-cyber-muted border-cyber-border";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 2:
        return (
          <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 3:
        return (
          <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cyber-dark">
      <Header />

      <main className="flex-1 container-app py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyber-text mb-2">Leaderboard</h1>
          <p className="text-cyber-muted">
            Top players ranked by total score
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="error" className="mb-8">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading leaderboard..." />
          </div>
        )}

        {/* Leaderboard */}
        {!loading && leaderboard.length > 0 && (
          <>
            {/* Top 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {leaderboard.slice(0, 3).map((entry) => (
                <Card
                  key={entry.uid}
                  className={`text-center ${
                    entry.uid === userData?.uid ? "ring-2 ring-primary-500" : ""
                  }`}
                >
                  <div className="flex justify-center mb-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${getRankStyle(
                        entry.rank
                      )}`}
                    >
                      {getRankIcon(entry.rank) || (
                        <span className="text-2xl font-bold">#{entry.rank}</span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-cyber-text mb-1">
                    {entry.displayName || "Anonymous"}
                  </h3>
                  <div className="text-2xl font-bold text-primary-400 mb-2">
                    {entry.score} pts
                  </div>
                  <div className="text-cyber-muted text-sm">
                    {entry.solvedCount} challenges solved
                  </div>
                  {entry.uid === userData?.uid && (
                    <div className="mt-3 text-xs text-primary-400">
                      (You)
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Full Leaderboard Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyber-border">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-cyber-text">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-cyber-text">
                        Player
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-cyber-text">
                        Score
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-cyber-text">
                        Solved
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.uid}
                        className={`border-b border-cyber-border/50 hover:bg-cyber-border/20 transition-colors ${
                          entry.uid === userData?.uid
                            ? "bg-primary-500/10"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {entry.rank <= 3 ? (
                              <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(
                                  entry.rank
                                )}`}
                              >
                                {entry.rank}
                              </span>
                            ) : (
                              <span className="w-8 h-8 flex items-center justify-center text-cyber-muted">
                                {entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyber-border flex items-center justify-center">
                              <span className="text-sm font-medium text-cyber-text">
                                {entry.displayName?.[0]?.toUpperCase() || "A"}
                              </span>
                            </div>
                            <span className="text-cyber-text">
                              {entry.displayName || "Anonymous"}
                              {entry.uid === userData?.uid && (
                                <span className="ml-2 text-xs text-primary-400">
                                  (You)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono font-semibold text-primary-400">
                            {entry.score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-cyber-muted">
                          {entry.solvedCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!loading && leaderboard.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-cyber-muted">
              No players on the leaderboard yet. Be the first to solve a challenge!
            </p>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
