/**
 * SEO Utilities
 * 
 * This module provides utilities for implementing proper SEO practices
 * including metadata, Open Graph, Twitter Cards, and structured data.
 */

import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  noIndex?: boolean;
  noFollow?: boolean;
}

/**
 * Generate comprehensive metadata for a page
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = '/harvest-hub-logo.png',
    ogType = 'website',
    twitterCard = 'summary_large_image',
    noIndex = false,
    noFollow = false,
  } = config;

  const robotsValue = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow',
  ].join(', ');

  return {
    title,
    description,
    keywords: keywords.join(', '),
    robots: robotsValue,
    
    // Canonical URL
    alternates: canonical ? {
      canonical,
    } : undefined,
    
    // Open Graph
    openGraph: {
      title,
      description,
      type: ogType,
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
      siteName: 'Harvest Hub',
    },
    
    // Twitter Card
    twitter: {
      card: twitterCard,
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Generate JSON-LD structured data for rich snippets
 */
export function generateStructuredData(type: string, data: any) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };
}

/**
 * Product structured data
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  image?: string;
  price: number;
  currency?: string;
  availability?: string;
  rating?: number;
  ratingCount?: number;
}) {
  return generateStructuredData('Product', {
    name: product.name,
    description: product.description,
    image: product.image || '/placeholder.png',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: product.availability || 'https://schema.org/InStock',
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.ratingCount || 0,
    } : undefined,
  });
}

/**
 * Organization structured data
 */
export function generateOrganizationSchema(org: {
  name: string;
  description: string;
  url: string;
  logo?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
}) {
  return generateStructuredData('Organization', {
    name: org.name,
    description: org.description,
    url: org.url,
    logo: org.logo || '/harvest-hub-logo.png',
    contactPoint: org.contactPoint,
  });
}

/**
 * Breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{
  name: string;
  url: string;
}>) {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/**
 * Article structured data
 */
export function generateArticleSchema(article: {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
}) {
  return generateStructuredData('Article', {
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author,
    },
  });
}

/**
 * FAQ structured data
 */
export function generateFAQSchema(faqs: Array<{
  question: string;
  answer: string;
}>) {
  return generateStructuredData('FAQPage', {
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });
}

/**
 * Structured Data Component
 * Renders JSON-LD script tag
 */
export function StructuredData({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Common SEO configurations for different page types
 */
export const SEOTemplates = {
  home: (): SEOConfig => ({
    title: 'Harvest Hub | Connecting Farmers and Buyers',
    description: 'Join Harvest Hub to connect directly with local farmers. Buy fresh, organic produce and support sustainable agriculture.',
    keywords: ['harvest hub', 'local farmers', 'organic produce', 'sustainable agriculture', 'farm to table'],
    ogType: 'website',
  }),
  
  products: (): SEOConfig => ({
    title: 'Fresh Products | Harvest Hub',
    description: 'Browse our selection of fresh, locally-sourced products. Direct from farm to your table.',
    keywords: ['fresh produce', 'organic vegetables', 'local farming', 'farm products'],
    ogType: 'website',
  }),
  
  product: (name: string, description: string): SEOConfig => ({
    title: `${name} | Harvest Hub`,
    description: description,
    keywords: ['fresh produce', name, 'organic', 'local'],
    ogType: 'product',
  }),
  
  dashboard: (role: string): SEOConfig => ({
    title: `${role} Dashboard | Harvest Hub`,
    description: `Manage your ${role} account on Harvest Hub.`,
    keywords: ['dashboard', role, 'harvest hub'],
    noIndex: true, // Don't index private pages
  }),
  
  login: (): SEOConfig => ({
    title: 'Login | Harvest Hub',
    description: 'Sign in to your Harvest Hub account to access your dashboard and manage your orders.',
    keywords: ['login', 'sign in', 'harvest hub'],
    noIndex: true,
  }),
  
  signup: (): SEOConfig => ({
    title: 'Sign Up | Harvest Hub',
    description: 'Create your Harvest Hub account to start buying from local farmers or selling your produce.',
    keywords: ['sign up', 'register', 'create account', 'harvest hub'],
  }),
};

/**
 * Generate sitemap entries
 */
export function generateSitemapEntry(
  url: string,
  priority: number = 0.5,
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'weekly'
) {
  return {
    url,
    lastModified: new Date(),
    changeFrequency: changefreq,
    priority,
  };
}
