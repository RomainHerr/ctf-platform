"use client";

/**
 * Email Verification Page
 * 
 * Prompts users to verify their email address.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Alert } from "@/components/ui";

export default function VerifyEmailPage(): React.ReactElement {
  const router = useRouter();
  const { user, resendVerificationEmail, signOut, loading } = useAuth();
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [countdown, setCountdown] = useState(0);

  // Redirect if no user or already verified
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (user.emailVerified) {
        router.replace("/challenges");
      }
    }
  }, [user, loading, router]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Poll for email verification
  useEffect(() => {
    if (!user || user.emailVerified) return;

    const checkVerification = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        router.replace("/challenges");
      }
    }, 3000);

    return () => clearInterval(checkVerification);
  }, [user, router]);

  const handleResend = async () => {
    if (countdown > 0) return;

    setResendStatus("sending");
    try {
      await resendVerificationEmail();
      setResendStatus("sent");
      setCountdown(60); // 60 second cooldown
    } catch {
      setResendStatus("error");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
        <div className="w-8 h-8 border-2 border-cyber-border border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

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
        <div className="bg-cyber-darker border border-cyber-border rounded-xl p-8 shadow-lg text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-cyber-text mb-2">
            Verify Your Email
          </h1>
          <p className="text-cyber-muted mb-6">
            We have sent a verification link to:
            <br />
            <span className="text-cyber-text font-medium">{user.email}</span>
          </p>

          {resendStatus === "sent" && (
            <Alert variant="success" className="mb-6">
              Verification email sent! Check your inbox.
            </Alert>
          )}

          {resendStatus === "error" && (
            <Alert variant="error" className="mb-6">
              Failed to send email. Please try again.
            </Alert>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleResend}
              variant="secondary"
              fullWidth
              disabled={countdown > 0 || resendStatus === "sending"}
              loading={resendStatus === "sending"}
            >
              {countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend Verification Email"}
            </Button>

            <Button onClick={() => signOut()} variant="ghost" fullWidth>
              Sign Out
            </Button>
          </div>

          <p className="mt-6 text-sm text-cyber-muted">
            Did not receive the email? Check your spam folder or try a different
            email address.
          </p>
        </div>
      </div>
    </div>
  );
}
