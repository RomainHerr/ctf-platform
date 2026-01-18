"use client";

/**
 * Home Page
 * 
 * Landing page with platform introduction and call-to-action.
 */

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui";

const features = [
  {
    title: "Web Exploitation",
    description:
      "Master web security through SQL injection, XSS, CSRF, and authentication bypass challenges.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
  },
  {
    title: "Cryptography",
    description:
      "Decode ciphers, break encryption, and understand cryptographic principles through hands-on challenges.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  },
  {
    title: "Digital Forensics",
    description:
      "Analyze disk images, memory dumps, and network captures to uncover hidden evidence.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    title: "Reverse Engineering",
    description:
      "Disassemble binaries, analyze malware, and understand program behavior at the lowest level.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
  {
    title: "Binary Exploitation",
    description:
      "Exploit buffer overflows, format strings, and other memory corruption vulnerabilities.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
        />
      </svg>
    ),
  },
  {
    title: "OSINT",
    description:
      "Gather intelligence from public sources and piece together information for reconnaissance.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
];

const stats = [
  { label: "Challenges", value: "50+" },
  { label: "Categories", value: "7" },
  { label: "Active Players", value: "500+" },
  { label: "Flags Captured", value: "10K+" },
];

export default function HomePage(): React.ReactElement {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-cyber-dark">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500/5 via-transparent to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-cyber-text mb-6 tracking-tight">
                Capture The Flag
                <span className="block text-primary-400 mt-2">
                  Cybersecurity Training Platform
                </span>
              </h1>
              <p className="text-lg md:text-xl text-cyber-muted mb-8 leading-relaxed">
                Sharpen your cybersecurity skills through hands-on challenges.
                From web exploitation to reverse engineering, test your abilities
                against real-world scenarios in a safe, competitive environment.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {!loading && (
                  <>
                    {user && user.emailVerified ? (
                      <Link href="/challenges">
                        <Button size="lg">
                          View Challenges
                        </Button>
                      </Link>
                    ) : user ? (
                      <Link href="/auth/verify-email">
                        <Button size="lg">
                          Verify Email to Continue
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/auth/register">
                          <Button size="lg">
                            Start Training
                          </Button>
                        </Link>
                        <Link href="/auth/login">
                          <Button variant="secondary" size="lg">
                            Sign In
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-cyber-darker/50 border-y border-cyber-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-cyber-muted text-sm uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-cyber-text mb-4">
                Challenge Categories
              </h2>
              <p className="text-cyber-muted max-w-2xl mx-auto">
                Explore diverse cybersecurity domains and build comprehensive
                skills across multiple disciplines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-6 bg-cyber-darker border border-cyber-border rounded-xl hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-cyber-text mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-cyber-muted text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary-600/20 to-blue-600/20 border-y border-cyber-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-cyber-text mb-4">
              Ready to Test Your Skills?
            </h2>
            <p className="text-cyber-muted mb-8 max-w-2xl mx-auto">
              Join the platform today and start solving challenges. Compete against
              other security enthusiasts and climb the leaderboard.
            </p>
            {!loading && !user && (
              <Link href="/auth/register">
                <Button size="lg">
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
