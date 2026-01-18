'use client';

/**
 * Loading State Component
 * Skeleton loading states for dashboard
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <Skeleton className="h-5 w-1/4" />
      </div>
      {/* Table Header */}
      <div className="grid gap-4 px-6 py-3 bg-gray-50" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 px-6 py-4 border-b border-gray-100 last:border-0"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${spinnerSizes[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = '로딩 중...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white/80 z-50 flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <LoadingSpinner size="lg" />
      {message && <p className="mt-4 text-gray-500">{message}</p>}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <h3 className="text-gray-900 font-medium">{title}</h3>
      {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  LoadingSpinner,
  LoadingOverlay,
  PageLoading,
  EmptyState,
};
