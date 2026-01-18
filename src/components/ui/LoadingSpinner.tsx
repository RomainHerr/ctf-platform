"use client";

/**
 * Loading Spinner Component
 * 
 * Displays a loading indicator with optional text.
 */

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-3",
};

export function LoadingSpinner({
  size = "md",
  text,
  className = "",
}: LoadingSpinnerProps): React.ReactElement {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border-cyber-border border-t-primary-500
          rounded-full animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-3 text-cyber-muted text-sm">{text}</p>
      )}
    </div>
  );
}

// Full page loading component
export function PageLoader(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}
