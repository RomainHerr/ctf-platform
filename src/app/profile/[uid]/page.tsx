"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Header, Footer } from "@/components/layout";
import { Card, LoadingSpinner, Alert } from "@/components/ui";
import Image from "next/image";

interface SolvedChallenge {
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
  solvedChallenges: SolvedChallenge[];
  cheatedChallenges: SolvedChallenge[];
  joinedAt: string | null;
}

const categoryColors: Record<string, string> = {
  web: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  crypto: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  forensics: "bg-green-500/20 text-green-400 border-green-500/30",
  reverse: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  pwn: "bg-red-500/20 text-red-400 border-red-500/30",
  misc: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  osint: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const difficultyColors: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

export default function PublicProfilePage() {
  const { isAuthorized, isLoading: authLoading } = useProtectedRoute({
    requireEmailVerified: true,
  });

  const params = useParams();
  const uid = params.uid as string;
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthorized || !uid) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await user?.getIdToken();
        const response = await fetch(`/api/user/${uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch profile");
        }

        setProfile(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthorized, uid, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-cyber-dark flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/leaderboard"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Leaderboard
        </Link>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="error">{error}</Alert>
        ) : profile ? (
          <div className="space-y-8">
            {/* Profile Header */}
            <Card className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  {profile.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt={profile.displayName}
                      width={96}
                      height={96}
                      className="rounded-full border-4 border-cyber-green/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-green/20 to-cyber-blue/20 border-4 border-cyber-green/30 flex items-center justify-center">
                      <span className="text-4xl font-bold text-cyber-green">
                        {profile.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {profile.rank && profile.rank <= 3 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-sm">
                      #{profile.rank}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profile.displayName}
                  </h1>

                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
                    {profile.rank && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Rank #{profile.rank}
                      </span>
                    )}
                    {profile.joinedAt && (
                      <span>
                        Joined{" "}
                        {new Date(profile.joinedAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyber-green">
                    {profile.score.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">points</div>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {profile.solvedChallenges.length}
                </div>
                <div className="text-sm text-gray-400">Challenges Solved</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-cyber-green">
                  {profile.score}
                </div>
                <div className="text-sm text-gray-400">Total Points</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {profile.rank || "-"}
                </div>
                <div className="text-sm text-gray-400">Global Rank</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {profile.solvedChallenges.length > 0
                    ? Math.round(
                        profile.score / profile.solvedChallenges.length
                      )
                    : 0}
                </div>
                <div className="text-sm text-gray-400">Avg Points/Challenge</div>
              </Card>
            </div>

            {/* Solved Challenges */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Solved Challenges ({profile.solvedChallenges.length})
              </h2>

              {profile.solvedChallenges.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No challenges solved yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {profile.solvedChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-center justify-between p-4 bg-cyber-darker/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            categoryColors[challenge.category] ||
                            categoryColors.misc
                          }`}
                        >
                          {challenge.category}
                        </div>
                        <div>
                          <Link
                            href={`/challenges/${challenge.id}`}
                            className="font-medium text-white hover:text-cyber-green transition-colors"
                          >
                            {challenge.title}
                          </Link>
                          <div
                            className={`text-xs ${
                              difficultyColors[challenge.difficulty] ||
                              "text-gray-400"
                            }`}
                          >
                            {challenge.difficulty}
                          </div>
                        </div>
                      </div>
                      <div className="text-cyber-green font-bold">
                        +{challenge.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Category Breakdown */}
            {profile.solvedChallenges.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Category Breakdown
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(
                    profile.solvedChallenges.reduce((acc, challenge) => {
                      acc[challenge.category] =
                        (acc[challenge.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <div
                      key={category}
                      className={`p-3 rounded-lg border text-center ${
                        categoryColors[category] || categoryColors.misc
                      }`}
                    >
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs capitalize">{category}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Cheated Challenges - Wall of Shame */}
            {profile.cheatedChallenges && profile.cheatedChallenges.length > 0 && (
              <Card className="p-6 border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-red-400">
                    Wall of Shame ({profile.cheatedChallenges.length})
                  </h2>
                </div>

                <p className="text-red-400/70 text-sm mb-4">
                  This player used the cheat feature on the following challenges:
                </p>

                <div className="space-y-2">
                  {profile.cheatedChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-4 h-4 text-red-500/70"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <span className="text-red-300 font-medium">
                            {challenge.title}
                          </span>
                          <span className="text-red-400/50 text-xs ml-2">
                            ({challenge.category} - {challenge.difficulty})
                          </span>
                        </div>
                      </div>
                      <div className="text-red-400/50 text-sm line-through">
                        {challenge.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
