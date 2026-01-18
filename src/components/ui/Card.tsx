"use client";

/**
 * Card Component
 * 
 * A reusable card container with optional hover effects.
 */

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: CardProps): React.ReactElement {
  const baseClasses =
    "bg-cyber-darker border border-cyber-border rounded-xl p-6 shadow-md transition-all duration-200";
  const hoverClasses = hover
    ? "hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer"
    : "";

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({
  children,
  className = "",
}: CardHeaderProps): React.ReactElement {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({
  children,
  className = "",
}: CardTitleProps): React.ReactElement {
  return (
    <h3 className={`text-xl font-semibold text-cyber-text ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({
  children,
  className = "",
}: CardContentProps): React.ReactElement {
  return <div className={className}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({
  children,
  className = "",
}: CardFooterProps): React.ReactElement {
  return (
    <div className={`mt-4 pt-4 border-t border-cyber-border ${className}`}>
      {children}
    </div>
  );
}
