"use client";

/**
 * Badge Component
 * 
 * Displays labels for categories, difficulties, and status.
 */

import React from "react";
import { ChallengeDifficulty, ChallengeCategory } from "@/types";

type BadgeVariant =
  | "default"
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "category"
  | "solved"
  | "success"
  | "warning"
  | "error";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-cyber-border/50 text-cyber-text border-cyber-border",
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  expert: "bg-red-500/20 text-red-400 border-red-500/30",
  category: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  solved: "bg-primary-500/20 text-primary-400 border-primary-500/30",
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Helper component for difficulty badges
interface DifficultyBadgeProps {
  difficulty: ChallengeDifficulty;
  className?: string;
}

export function DifficultyBadge({
  difficulty,
  className = "",
}: DifficultyBadgeProps): React.ReactElement {
  const labels: Record<ChallengeDifficulty, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
  };

  return (
    <Badge variant={difficulty} className={className}>
      {labels[difficulty]}
    </Badge>
  );
}

// Helper component for category badges
interface CategoryBadgeProps {
  category: ChallengeCategory;
  className?: string;
}

const categoryLabels: Record<ChallengeCategory, string> = {
  web: "Web",
  crypto: "Crypto",
  forensics: "Forensics",
  reverse: "Reverse",
  pwn: "Pwn",
  misc: "Misc",
  osint: "OSINT",
};

export function CategoryBadge({
  category,
  className = "",
}: CategoryBadgeProps): React.ReactElement {
  return (
    <Badge variant="category" className={className}>
      {categoryLabels[category]}
    </Badge>
  );
}
