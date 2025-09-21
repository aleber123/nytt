import React, { ComponentType, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface WithErrorBoundaryProps {
  fallback?: ReactNode;
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 * @param Component The component to wrap
 * @param fallbackUI Optional custom fallback UI to show when an error occurs
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallbackUI?: ReactNode
) {
  const WithErrorBoundary = (props: P & WithErrorBoundaryProps) => {
    const { fallback = fallbackUI, ...componentProps } = props;
    
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...componentProps as P} />
      </ErrorBoundary>
    );
  };

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

export default withErrorBoundary;
