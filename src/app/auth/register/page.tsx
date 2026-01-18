"use client";

/**
 * Registration Page
 * 
 * Handles new user registration with strong password validation.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Alert } from "@/components/ui";
import { validatePassword, validateEmail } from "@/lib/security";

export default function RegisterPage(): React.ReactElement {
  const router = useRouter();
  const { user, signUp, signInWithGoogle, signInWithGithub, error, clearError, loading } =
    useAuth();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string>("");

  // Redirect if already authenticated
  useEffect(() => {
    if (user && user.emailVerified) {
      router.replace("/challenges");
    } else if (user && !user.emailVerified) {
      router.replace("/auth/verify-email");
    }
  }, [user, router]);

  // Check password strength on change
  useEffect(() => {
    if (formData.password) {
      const validation = validatePassword(formData.password);
      setPasswordStrength(validation.strength);
    } else {
      setPasswordStrength("");
    }
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setLocalError(emailValidation.errors[0]);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setLocalError(passwordValidation.errors[0]);
      return;
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    // Validate display name
    if (formData.displayName.trim().length < 2) {
      setLocalError("Display name must be at least 2 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
      });
      router.push("/auth/verify-email");
    } catch {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLocalError(null);
    clearError();

    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
    } catch {
      // Error is handled by context
    }
  };

  const displayError = error || localError;

  const strengthColors = {
    weak: "bg-red-500",
    fair: "bg-yellow-500",
    strong: "bg-green-500",
    very_strong: "bg-primary-500",
  };

  const strengthWidths = {
    weak: "w-1/4",
    fair: "w-1/2",
    strong: "w-3/4",
    very_strong: "w-full",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <svg
              className="w-10 h-10 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-2xl font-bold text-cyber-text">CTF Platform</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-cyber-darker border border-cyber-border rounded-xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-cyber-text text-center mb-2">
            Create Account
          </h1>
          <p className="text-cyber-muted text-center mb-8">
            Start your cybersecurity training journey
          </p>

          {displayError && (
            <Alert variant="error" className="mb-6" onClose={clearError}>
              {displayError}
            </Alert>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Continue with GitHub
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cyber-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-cyber-darker text-cyber-muted">
                or register with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Display Name"
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Your username"
              required
              autoComplete="username"
              disabled={isSubmitting}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isSubmitting}
            />

            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 12 characters"
                required
                autoComplete="new-password"
                disabled={isSubmitting}
                helperText="Must include uppercase, lowercase, number, and symbol"
              />
              {passwordStrength && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-cyber-border rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthColors[passwordStrength as keyof typeof strengthColors]
                      } ${strengthWidths[passwordStrength as keyof typeof strengthWidths]}`}
                    />
                  </div>
                  <p className="text-xs text-cyber-muted mt-1 capitalize">
                    Password strength: {passwordStrength.replace("_", " ")}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              error={
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword
                  ? "Passwords do not match"
                  : undefined
              }
            />

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={loading}
            >
              Create Account
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-cyber-muted">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
