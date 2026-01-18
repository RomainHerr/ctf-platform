"use client";

/**
 * Challenges Page
 * 
 * Displays all available challenges with filtering options.
 * Protected route - requires authentication and email verification.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import {
  Card,
  Badge,
  DifficultyBadge,
  CategoryBadge,
  LoadingSpinner,
  Alert,
} from "@/components/ui";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useApi } from "@/hooks/useApi";
import {
  ChallengePublic,
  ChallengeCategory,
  ChallengeDifficulty,
} from "@/types";

const categories: (ChallengeCategory | "all")[] = [
  "all",
  "web",
  "crypto",
  "forensics",
  "reverse",
  "pwn",
  "misc",
  "osint",
];

const difficulties: (ChallengeDifficulty | "all")[] = [
  "all",
  "easy",
  "medium",
  "hard",
  "expert",
  "insane",
];

export default function ChallengesPage(): React.ReactElement {
  const router = useRouter();
  const { isAuthorized, isLoading: authLoading } = useProtectedRoute();
  const { execute, loading, error } = useApi<ChallengePublic[]>();

  const [challenges, setChallenges] = useState<ChallengePublic[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ChallengeCategory | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<ChallengeDifficulty | "all">("all");
  const [showSolved, setShowSolved] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch challenges
  useEffect(() => {
    if (isAuthorized) {
      fetchChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  const fetchChallenges = async () => {
    const result = await execute("/api/challenges");
    if (result?.success && result.data) {
      setChallenges(result.data);
    }
  };

  // Filtered challenges
  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      // Category filter
      if (categoryFilter !== "all" && challenge.category !== categoryFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== "all" && challenge.difficulty !== difficultyFilter) {
        return false;
      }

      // Solved filter
      if (!showSolved && challenge.isSolved) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          challenge.title.toLowerCase().includes(query) ||
          challenge.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [challenges, categoryFilter, difficultyFilter, showSolved, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const activeChallenges = challenges.filter((c) => !c.isComingSoon);
    const total = activeChallenges.length;
    const solved = activeChallenges.filter((c) => c.isSolved).length;
    const points = activeChallenges
      .filter((c) => c.isSolved)
      .reduce((acc, c) => acc + c.points, 0);
    const comingSoon = challenges.filter((c) => c.isComingSoon).length;
    return { total, solved, points, comingSoon };
  }, [challenges]);

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

  return (
    <div className="min-h-screen flex flex-col bg-cyber-dark">
      <Header />

      <main className="flex-1 container-app py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyber-text mb-2">Challenges</h1>
          <p className="text-cyber-muted">
            Test your skills across multiple cybersecurity domains
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center py-4">
            <div className="text-2xl font-bold text-primary-400">{stats.solved}</div>
            <div className="text-cyber-muted text-sm">Solved</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-bold text-cyber-text">{stats.total}</div>
            <div className="text-cyber-muted text-sm">Active</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.points}</div>
            <div className="text-cyber-muted text-sm">Points</div>
          </Card>
          <Card className="text-center py-4 border-dashed border-gray-600">
            <div className="text-2xl font-bold text-gray-500">{stats.comingSoon}</div>
            <div className="text-gray-600 text-sm">Coming Soon</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-cyber-text placeholder-cyber-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                      : "bg-cyber-dark text-cyber-muted hover:text-cyber-text border border-cyber-border"
                  }`}
                >
                  {cat === "all" ? "All Categories" : cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-cyber-border">
            {/* Difficulty Filter */}
            <div className="flex flex-wrap gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    difficultyFilter === diff
                      ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                      : "bg-cyber-dark text-cyber-muted hover:text-cyber-text border border-cyber-border"
                  }`}
                >
                  {diff === "all" ? "All Difficulties" : diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>

            {/* Show Solved Toggle */}
            <label className="flex items-center gap-2 text-sm text-cyber-muted cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={showSolved}
                onChange={(e) => setShowSolved(e.target.checked)}
                className="w-4 h-4 rounded border-cyber-border bg-cyber-dark text-primary-500 focus:ring-primary-500"
              />
              Show solved challenges
            </label>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="error" className="mb-8">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading challenges..." />
          </div>
        )}

        {/* Challenges Grid */}
        {!loading && (
          <>
            {filteredChallenges.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-cyber-muted">No challenges found matching your filters.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChallenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    hover={!challenge.isComingSoon}
                    onClick={() => !challenge.isComingSoon && router.push(`/challenges/${challenge.id}`)}
                    className={`
                      ${challenge.isSolved ? "border-primary-500/30" : ""}
                      ${challenge.isComingSoon ? "opacity-50 cursor-not-allowed border-dashed border-gray-600" : "cursor-pointer"}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <CategoryBadge category={challenge.category} />
                      <div className="flex gap-2">
                        {challenge.isComingSoon && (
                          <Badge variant="coming">Coming Soon</Badge>
                        )}
                        {challenge.isSolved && !challenge.isComingSoon && (
                          <Badge variant="solved">Solved</Badge>
                        )}
                      </div>
                    </div>

                    <h3 className={`text-lg font-semibold mb-2 ${challenge.isComingSoon ? "text-gray-500" : "text-cyber-text"}`}>
                      {challenge.title}
                    </h3>

                    <p className={`text-sm mb-4 line-clamp-2 ${challenge.isComingSoon ? "text-gray-600" : "text-cyber-muted"}`}>
                      {challenge.isComingSoon 
                        ? "This challenge is not yet available. Stay tuned for updates!"
                        : challenge.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-cyber-border">
                      <DifficultyBadge difficulty={challenge.difficulty} />
                      <div className="flex items-center gap-4 text-sm">
                        <span className={challenge.isComingSoon ? "text-gray-500 font-medium" : "text-yellow-400 font-medium"}>
                          {challenge.points} pts
                        </span>
                        {!challenge.isComingSoon && (
                          <span className="text-cyber-muted">
                            {challenge.solveCount} solves
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
