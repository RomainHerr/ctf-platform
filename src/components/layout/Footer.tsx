"use client";

/**
 * Footer Component
 */

import React from "react";
import Link from "next/link";

export function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-cyber-darker border-t border-cyber-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-cyber-text font-semibold mb-4">CTF Platform</h3>
            <p className="text-cyber-muted text-sm leading-relaxed">
              A secure Capture The Flag platform for cybersecurity training and
              competitions. Test your skills across multiple categories including
              web exploitation, cryptography, and forensics.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-cyber-text font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/challenges"
                  className="text-cyber-muted hover:text-primary-400 transition-colors"
                >
                  Challenges
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-cyber-muted hover:text-primary-400 transition-colors"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  href="/rules"
                  className="text-cyber-muted hover:text-primary-400 transition-colors"
                >
                  Rules
                </Link>
              </li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-cyber-text font-semibold mb-4">Security</h3>
            <p className="text-cyber-muted text-sm leading-relaxed">
              This platform implements industry-standard security practices
              including secure authentication, rate limiting, and data encryption.
              All flag validations occur server-side.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-cyber-border">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-cyber-muted">
            <p>Copyright {currentYear} CTF Platform. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">
              Academic Cybersecurity Project
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
