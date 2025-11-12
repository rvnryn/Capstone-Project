/**
 * Skeleton Components
 * Shows loading placeholders while data is being fetched
 * Improves perceived performance and UX
 */

import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: "skeleton-loading 1.5s ease-in-out infinite",
      }}
      {...props}
    >
      <style jsx>{`
        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex gap-4">
        {Array(columns)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1" />
          ))}
      </div>

      {/* Data Rows */}
      {Array(rows)
        .fill(0)
        .map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array(columns)
              .fill(0)
              .map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-12 flex-1" />
              ))}
          </div>
        ))}
    </div>
  );
}

// Card Grid Skeleton
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" /> {/* Title */}
      <Skeleton className="h-64 w-full" /> {/* Chart */}
      <div className="flex gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array(fields)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
        ))}
      <Skeleton className="h-10 w-32 mt-6" /> {/* Submit button */}
    </div>
  );
}

/**
 * Usage Examples:
 *
 * // Simple skeleton
 * {loading ? <Skeleton className="h-32 w-full" /> : <Content />}
 *
 * // Table skeleton
 * {loading ? <TableSkeleton rows={10} columns={5} /> : <Table data={data} />}
 *
 * // Card grid skeleton
 * {loading ? <CardGridSkeleton count={9} /> : <CardGrid items={items} />}
 *
 * // List skeleton
 * {loading ? <ListSkeleton count={8} /> : <List items={items} />}
 *
 * // Chart skeleton
 * {loading ? <ChartSkeleton /> : <Chart data={data} />}
 */
