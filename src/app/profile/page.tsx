"use client";

/**
 * Profile Page
 * 
 * Displays and allows editing of user profile.
 */

import React, { useState, useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import { Card, Button, Input, Alert, Badge, LoadingSpinner } from "@/components/ui";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { UserPublic } from "@/types";

export default function ProfilePage(): React.ReactElement {
  const { isAuthorized, isLoading: authLoading } = useProtectedRoute();
  const { user, userData } = useAuth();
  const { execute: fetchProfile, loading: fetchLoading, error: fetchError } = useApi<UserPublic>();
  const { execute: updateProfile, loading: updateLoading, error: updateError } = useApi<{ updated: boolean }>();

  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch profile
  useEffect(() => {
    if (isAuthorized) {
      loadProfile();
    }
  }, [isAuthorized]);

  const loadProfile = async () => {
    const result = await fetchProfile("/api/user/profile");
    if (result?.success && result.data) {
      setProfile(result.data);
      setDisplayName(result.data.displayName || "");
    }
  };

  const handleSave = async () => {
    setUpdateSuccess(false);
    const result = await updateProfile("/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName }),
    });

    if (result?.success) {
      setIsEditing(false);
      setUpdateSuccess(true);
      loadProfile();
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyber-text mb-2">Profile</h1>
          <p className="text-cyber-muted">
            Manage your account settings
          </p>
        </div>

        {/* Error States */}
        {fetchError && (
          <Alert variant="error" className="mb-6">
            {fetchError}
          </Alert>
        )}
        {updateError && (
          <Alert variant="error" className="mb-6">
            {updateError}
          </Alert>
        )}
        {updateSuccess && (
          <Alert variant="success" className="mb-6">
            Profile updated successfully!
          </Alert>
        )}

        {/* Loading State */}
        {fetchLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading profile..." />
          </div>
        )}

        {/* Profile Content */}
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Score Card */}
              <Card className="text-center">
                <div className="text-4xl font-bold text-primary-400 mb-2">
                  {profile.score}
                </div>
                <div className="text-cyber-muted">Total Points</div>
              </Card>

              {/* Rank Card */}
              <Card className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  #{profile.rank || "-"}
                </div>
                <div className="text-cyber-muted">Global Rank</div>
              </Card>

              {/* Solved Card */}
              <Card className="text-center">
                <div className="text-4xl font-bold text-cyber-text mb-2">
                  {profile.solvedChallenges.length}
                </div>
                <div className="text-cyber-muted">Challenges Solved</div>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-cyber-text mb-6">
                  Account Information
                </h2>

                <div className="space-y-4">
                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-cyber-muted mb-2">
                      Email
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-cyber-muted">
                        {user?.email}
                      </div>
                      {user?.emailVerified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Unverified</Badge>
                      )}
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-cyber-muted mb-2">
                      Display Name
                    </label>
                    {isEditing ? (
                      <div className="flex items-center gap-3">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your display name"
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSave}
                          loading={updateLoading}
                          disabled={displayName.trim().length < 2}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsEditing(false);
                            setDisplayName(profile.displayName || "");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-cyber-text">
                          {profile.displayName || "Not set"}
                        </div>
                        <Button variant="secondary" onClick={() => setIsEditing(true)}>
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* UID (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-cyber-muted mb-2">
                      User ID
                    </label>
                    <div className="px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-cyber-muted font-mono text-sm">
                      {profile.uid}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Solved Challenges */}
              {profile.solvedChallenges.length > 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-cyber-text mb-4">
                    Solved Challenges
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.solvedChallenges.map((challengeId) => (
                      <Badge key={challengeId} variant="solved">
                        {challengeId}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
