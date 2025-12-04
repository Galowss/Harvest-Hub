/**
 * Data Fetching Strategy Utilities
 * 
 * This module provides optimized data fetching methods for Next.js 15 using:
 * - SSR (Server-Side Rendering) - fetch on every request
 * - SSG (Static Site Generation) - fetch at build time
 * - ISR (Incremental Static Regeneration) - fetch at build time + revalidate
 */

import { cache } from 'react';

// Cache durations in seconds
export const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

/**
 * SSR - Server-Side Rendering
 * Fetches data on every request (no caching)
 * Use for: Dynamic content that changes frequently or user-specific data
 */
export async function fetchSSR<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: 'no-store', // Disable caching for SSR
  });

  if (!response.ok) {
    throw new Error(`SSR fetch failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * SSG - Static Site Generation
 * Fetches data at build time (cached indefinitely)
 * Use for: Static content that rarely changes
 */
export async function fetchSSG<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: 'force-cache', // Cache indefinitely
  });

  if (!response.ok) {
    throw new Error(`SSG fetch failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * ISR - Incremental Static Regeneration
 * Fetches data at build time and revalidates after specified time
 * Use for: Content that changes occasionally but can be cached
 */
export async function fetchISR<T>(
  url: string,
  revalidate: number = CACHE_DURATION.MEDIUM,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    next: { revalidate }, // Revalidate after specified seconds
  });

  if (!response.ok) {
    throw new Error(`ISR fetch failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cached fetch function using React's cache()
 * Deduplicates requests within a single render pass
 */
export const cachedFetch = cache(async <T,>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Cached fetch failed: ${response.statusText}`);
  }

  return response.json();
});

/**
 * Fetch with retry logic
 * Automatically retries failed requests with exponential backoff
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;
      
      // Exponential backoff: wait 2^i seconds before retry
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} retries: ${lastError?.message}`);
}

/**
 * Parallel data fetching
 * Fetches multiple resources simultaneously
 */
export async function fetchParallel<T extends readonly unknown[]>(
  ...fetchers: Array<() => Promise<T[number]>>
): Promise<T> {
  return Promise.all(fetchers.map(fetcher => fetcher())) as Promise<T>;
}

/**
 * Firestore data fetching with SSR/SSG/ISR support
 */
export interface FirestoreOptions {
  strategy?: 'ssr' | 'ssg' | 'isr';
  revalidate?: number;
}

/**
 * Helper to determine fetch strategy based on route type
 */
export function getOptimalStrategy(routeType: 'static' | 'dynamic' | 'hybrid'): 'ssr' | 'ssg' | 'isr' {
  switch (routeType) {
    case 'static':
      return 'ssg';
    case 'dynamic':
      return 'ssr';
    case 'hybrid':
      return 'isr';
    default:
      return 'isr';
  }
}

/**
 * Example metadata generation for SEO (used in pages)
 */
export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    images?: Array<{ url: string; alt?: string }>;
  };
}

export function generateMetadata(data: PageMetadata) {
  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords?.join(', '),
    openGraph: {
      title: data.openGraph?.title || data.title,
      description: data.openGraph?.description || data.description,
      images: data.openGraph?.images || [],
    },
  };
}
