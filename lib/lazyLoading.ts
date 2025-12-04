/**
 * Lazy Loading Utilities
 * 
 * This module provides utilities for implementing React lazy loading
 * to reduce initial bundle size and improve page load performance.
 */

import dynamic from 'next/dynamic';
import { ComponentType, Suspense, ReactNode } from 'react';

/**
 * Loading fallback component
 */
export function LoadingFallback({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton loading component
 */
export function SkeletonLoader({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Lazy load a component with custom loading fallback
 */
export function lazyLoad<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = <LoadingFallback />
) {
  const LazyComponent = dynamic(importFunc, {
    loading: () => <>{fallback}</>,
    ssr: false, // Disable SSR for lazy-loaded components
  });

  return function LazyLoadedComponent(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load with SSR support (for components that need to be rendered on server)
 */
export function lazyLoadWithSSR<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = <LoadingFallback />
) {
  const LazyComponent = dynamic(importFunc, {
    loading: () => <>{fallback}</>,
    ssr: true, // Enable SSR
  });

  return function LazyLoadedComponent(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component (useful for prefetching)
 */
export function preloadComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
) {
  return importFunc();
}

/**
 * Lazy load with retry logic
 */
export function lazyLoadWithRetry<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  retries = 3,
  fallback: ReactNode = <LoadingFallback />
) {
  const loadWithRetry = async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await importFunc();
      } catch (error) {
        lastError = error as Error;
        
        // Wait before retry (exponential backoff)
        if (i < retries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      }
    }

    throw lastError || new Error('Failed to load component');
  };

  const LazyComponent = dynamic(loadWithRetry, {
    loading: () => <>{fallback}</>,
    ssr: false,
  });

  return function LazyLoadedComponent(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Route-based code splitting helper
 * Lazy loads entire page components
 */
export function lazyLoadPage<P extends object>(
  pagePath: string,
  fallback: ReactNode = <LoadingFallback text="Loading page..." />
) {
  return lazyLoad<P>(
    () => import(`@/app/${pagePath}/page`),
    fallback
  );
}

/**
 * Component-based code splitting
 * For heavy components that should be loaded on demand
 */
export const LazyComponents = {
  // Dashboard components (heavy)
  AdminDashboard: dynamic(() => import('@/app/dashboard/admin/page'), {
    loading: () => <LoadingFallback text="Loading admin dashboard..." />,
  }),
  
  FarmerDashboard: dynamic(() => import('@/app/dashboard/farmer/page'), {
    loading: () => <LoadingFallback text="Loading farmer dashboard..." />,
  }),
  
  UserDashboard: dynamic(() => import('@/app/dashboard/user/page'), {
    loading: () => <LoadingFallback text="Loading dashboard..." />,
  }),
  
  // Map component (heavy with Leaflet)
  MapView: dynamic(() => import('@/app/dashboard/map/page'), {
    loading: () => <LoadingFallback text="Loading map..." />,
    ssr: false, // Maps often don't work well with SSR
  }),
  
  // Community features
  Community: dynamic(() => import('@/app/dashboard/community/page'), {
    loading: () => <LoadingFallback text="Loading community..." />,
  }),
};

/**
 * Image lazy loading wrapper
 */
export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * Intersection Observer hook for lazy loading content
 */
export function useLazyLoad(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) {
  if (typeof window === 'undefined') return { isVisible: true };

  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      options
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, options]);

  return { isVisible };
}

// Re-export React for the hook
import React from 'react';
