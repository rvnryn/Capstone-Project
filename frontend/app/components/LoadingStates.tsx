/**
 * Reusable Loading State Components
 * Professional loading screens for tables, cards, and pages
 */

import React from "react";

// ===========================
// SPINNER COMPONENTS
// ===========================

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "border-red-600",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

// ===========================
// FULL PAGE LOADING
// ===========================

interface FullPageLoadingProps {
  message?: string;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="xl" />
        <p className="mt-4 text-gray-600 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};

// ===========================
// TABLE LOADING (SKELETON)
// ===========================

interface TableLoadingProps {
  rows?: number;
  columns?: number;
  message?: string;
}

export const TableLoading: React.FC<TableLoadingProps> = ({
  rows = 5,
  columns = 6,
  message = "Loading data...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 w-full">
      <Spinner size="lg" color="border-yellow-400" />
      <span className="text-yellow-400 font-medium text-lg mt-4">{message}</span>
    </div>
  );
};

// ===========================
// CARD LOADING (SKELETON)
// ===========================

interface CardLoadingProps {
  count?: number;
}

export const CardLoading: React.FC<CardLoadingProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
        >
          <div className="h-4 bg-gray-300 rounded w-2/3 mb-4 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
      ))}
    </div>
  );
};

// ===========================
// INLINE LOADING (for buttons, small sections)
// ===========================

interface InlineLoadingProps {
  message?: string;
  size?: "sm" | "md";
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = "Loading...",
  size = "sm",
}) => {
  return (
    <div className="flex items-center justify-center py-2">
      <Spinner size={size} className="mr-2" />
      <span className="text-gray-600 text-sm">{message}</span>
    </div>
  );
};

// ===========================
// EMPTY STATE (no data)
// ===========================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = "No data found",
  message = "There are no items to display.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 text-center mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// ===========================
// SECTION LOADING (for page sections)
// ===========================

interface SectionLoadingProps {
  height?: string;
  message?: string;
}

export const SectionLoading: React.FC<SectionLoadingProps> = ({
  height = "h-64",
  message = "Loading section...",
}) => {
  return (
    <div
      className={`${height} flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200`}
    >
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

// ===========================
// OVERLAY LOADING (for modals, dialogs)
// ===========================

interface OverlayLoadingProps {
  message?: string;
  isVisible?: boolean;
}

export const OverlayLoading: React.FC<OverlayLoadingProps> = ({
  message = "Processing...",
  isVisible = true,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-40 rounded-lg">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// ===========================
// PROGRESS BAR
// ===========================

interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message = "Loading...",
  showPercentage = true,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600 font-medium">{message}</span>
        {showPercentage && (
          <span className="text-sm text-gray-600 font-semibold">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-red-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

// ===========================
// PULSING DOTS
// ===========================

export const PulsingDots: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
      <div
        className="w-3 h-3 bg-red-600 rounded-full animate-pulse"
        style={{ animationDelay: "0.2s" }}
      ></div>
      <div
        className="w-3 h-3 bg-red-600 rounded-full animate-pulse"
        style={{ animationDelay: "0.4s" }}
      ></div>
    </div>
  );
};

// ===========================
// LOADING TEXT (animated)
// ===========================

interface LoadingTextProps {
  text?: string;
}

export const LoadingText: React.FC<LoadingTextProps> = ({
  text = "Loading",
}) => {
  return (
    <div className="flex items-center space-x-1">
      <span className="text-gray-600 font-medium">{text}</span>
      <span className="animate-bounce">.</span>
      <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
        .
      </span>
      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
        .
      </span>
    </div>
  );
};
