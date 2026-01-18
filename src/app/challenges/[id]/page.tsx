"use client";

/**
 * Challenge Detail Page
 * 
 * Displays a single challenge with flag submission form.
 * Protected route - requires authentication and email verification.
 */

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import {
  Card,
  Button,
  Input,
  Alert,
  DifficultyBadge,
  CategoryBadge,
  Badge,
  LoadingSpinner,
  Modal,
} from "@/components/ui";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useApi, useSubmitFlag } from "@/hooks/useApi";
import { ChallengePublic } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChallengeDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { isAuthorized, isLoading: authLoading } = useProtectedRoute();
  const { user } = useAuth();
  const { execute, loading: fetchLoading, error: fetchError } = useApi<ChallengePublic>();
  const { submitFlag, loading: submitLoading } = useSubmitFlag();

  const [challenge, setChallenge] = useState<ChallengePublic | null>(null);
  const [flag, setFlag] = useState("");
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    points?: number;
  } | null>(null);
  const [showHints, setShowHints] = useState<boolean[]>([]);
  
  // Cheat modal state
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [cheatLoading, setCheatLoading] = useState(false);
  const [cheatSolution, setCheatSolution] = useState<{
    flag: string;
    explanation: string;
  } | null>(null);

  // Fetch challenge
  useEffect(() => {
    if (isAuthorized && id) {
      fetchChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, id]);

  const fetchChallenge = async () => {
    const response = await execute(`/api/challenges/${id}`);
    if (response?.success && response.data) {
      setChallenge(response.data);
      setShowHints(new Array(response.data.hints.length).fill(false));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || !challenge) return;

    setResult(null);
    const response = await submitFlag(challenge.id, flag.trim());

    if (response?.success && response.data) {
      if (response.data.correct) {
        setResult({
          type: "success",
          message: response.data.message,
          points: response.data.pointsAwarded,
        });
        // Update local challenge state
        setChallenge((prev) => (prev ? { ...prev, isSolved: true } : null));
        setFlag("");
      } else {
        setResult({
          type: "error",
          message: response.data.message,
        });
      }
    } else if (response?.error) {
      setResult({
        type: "error",
        message: response.error,
      });
    }
  };

  const toggleHint = (index: number) => {
    setShowHints((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const handleCheatConfirm = async () => {
    if (!challenge || !user) return;

    setCheatLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/challenges/cheat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setCheatSolution({
          flag: data.data.flag,
          explanation: data.data.explanation,
        });
      } else {
        setResult({
          type: "error",
          message: data.error || "Failed to get solution",
        });
        setShowCheatModal(false);
      }
    } catch {
      setResult({
        type: "error",
        message: "Failed to get solution",
      });
      setShowCheatModal(false);
    } finally {
      setCheatLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-cyber-dark">
      <Header />

      <main className="flex-1 container-app py-8">
        {/* Back link */}
        <Link
          href="/challenges"
          className="inline-flex items-center text-cyber-muted hover:text-primary-400 mb-6 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Challenges
        </Link>

        {/* Loading State */}
        {fetchLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading challenge..." />
          </div>
        )}

        {/* Error State */}
        {fetchError && (
          <Alert variant="error" className="mb-8">
            {fetchError}
          </Alert>
        )}

        {/* Challenge Content */}
        {challenge && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Challenge Header */}
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CategoryBadge category={challenge.category} />
                    <DifficultyBadge difficulty={challenge.difficulty} />
                    {challenge.isSolved && <Badge variant="solved">Solved</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-yellow-400 font-bold text-lg">
                      {challenge.points} pts
                    </span>
                    <span className="text-cyber-muted">
                      {challenge.solveCount} solves
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-cyber-text mb-4">
                  {challenge.title}
                </h1>

                <div className="prose prose-invert max-w-none">
                  <p className="text-cyber-muted whitespace-pre-wrap">
                    {challenge.description}
                  </p>
                </div>
              </Card>

              {/* Attachments */}
              {challenge.attachments.length > 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-cyber-text mb-4">
                    Attachments
                  </h2>
                  <div className="space-y-2">
                    {challenge.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-cyber-dark rounded-lg hover:bg-cyber-border/30 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 text-cyber-muted"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-cyber-text">{attachment.name}</span>
                        <span className="text-cyber-muted text-sm ml-auto">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </span>
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* Hints */}
              {challenge.hints.length > 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-cyber-text mb-4">
                    Hints
                  </h2>
                  <div className="space-y-3">
                    {challenge.hints.map((hint, index) => (
                      <div
                        key={index}
                        className="border border-cyber-border rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleHint(index)}
                          className="w-full flex items-center justify-between p-3 bg-cyber-dark hover:bg-cyber-border/30 transition-colors"
                        >
                          <span className="text-cyber-text">Hint {index + 1}</span>
                          <svg
                            className={`w-5 h-5 text-cyber-muted transition-transform ${
                              showHints[index] ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {showHints[index] && (
                          <div className="p-3 border-t border-cyber-border bg-cyber-darker">
                            <p className="text-cyber-muted">{hint}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar - Flag Submission */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <h2 className="text-lg font-semibold text-cyber-text mb-4">
                  Submit Flag
                </h2>

                {challenge.isSolved ? (
                  <Alert variant="success">
                    You have already solved this challenge!
                  </Alert>
                ) : (
                  <>
                    {result && (
                      <Alert
                        variant={result.type}
                        className="mb-4"
                        onClose={() => setResult(null)}
                      >
                        {result.message}
                        {result.points && (
                          <span className="block mt-1 font-medium">
                            +{result.points} points!
                          </span>
                        )}
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        label="Flag"
                        type="text"
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        placeholder="CTF{...}"
                        disabled={submitLoading}
                        autoComplete="off"
                      />

                      <Button
                        type="submit"
                        fullWidth
                        loading={submitLoading}
                        disabled={!flag.trim()}
                      >
                        Submit Flag
                      </Button>
                    </form>

                    <p className="mt-4 text-xs text-cyber-muted">
                      Flags are case-insensitive. Rate limited to 5 attempts per minute.
                    </p>

                    {/* Cheat Button */}
                    <div className="mt-6 pt-6 border-t border-cyber-border">
                      <button
                        onClick={() => setShowCheatModal(true)}
                        className="w-full py-2 px-4 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-200"
                      >
                        I want to cheat
                      </button>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Cheat Warning Modal */}
        <Modal
          isOpen={showCheatModal}
          onClose={() => {
            setShowCheatModal(false);
            setCheatSolution(null);
          }}
          title="Warning: Cheating"
          variant="warning"
        >
          {!cheatSolution ? (
            <>
              <div className="space-y-4">
                <p className="text-gray-300">
                  You are about to reveal the solution for this challenge.
                </p>
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm font-medium mb-2">
                    This action will be permanently recorded on your profile.
                  </p>
                  <p className="text-yellow-400/70 text-sm">
                    Other players will be able to see that you cheated on this challenge.
                  </p>
                </div>

                <p className="text-gray-400 text-sm">
                  Are you sure you want to continue?
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowCheatModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCheatConfirm}
                  loading={cheatLoading}
                  className="flex-1"
                >
                  Yes, show me the solution
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-xs font-medium mb-2 uppercase tracking-wide">
                    Cheated - Recorded on your profile
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Flag
                  </label>
                  <div className="p-3 bg-cyber-dark border border-cyber-border rounded-lg font-mono text-cyber-green break-all">
                    {cheatSolution.flag}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Explanation
                  </label>
                  <p className="text-gray-300 text-sm">
                    {cheatSolution.explanation}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCheatModal(false);
                    setCheatSolution(null);
                  }}
                  fullWidth
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </Modal>
      </main>

      <Footer />
    </div>
  );
}
