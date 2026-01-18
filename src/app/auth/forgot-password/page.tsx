"use client";

/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset email.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Alert } from "@/components/ui";

export default function ForgotPasswordPage(): React.ReactElement {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    try {
      await resetPassword(email);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark px-4">
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
            Reset Password
          </h1>
          <p className="text-cyber-muted text-center mb-8">
            Enter your email and we will send you a reset link
          </p>

          {status === "sent" ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <Alert variant="success" className="mb-6">
                If an account exists with that email, you will receive a password
                reset link shortly.
              </Alert>
              <Link href="/auth/login">
                <Button fullWidth>Return to Sign In</Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="error" className="mb-6">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={status === "sending"}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={status === "sending"}
                >
                  Send Reset Link
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-cyber-muted">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
