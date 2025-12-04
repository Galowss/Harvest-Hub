'use client';

import { ReactNode } from 'react';
import { Navigation } from '@/components/organisms';
import { SearchBar } from '@/components/molecules';
import { Toaster } from '@/components/atoms';

interface MarketplaceTemplateProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  categories?: string[];
  showSearch?: boolean;
  userRole?: 'user' | 'farmer' | 'admin' | 'guest';
  onLogout?: () => void;
  navItems?: Array<{ href: string; label: string; icon: React.ReactNode }>;
}

export function MarketplaceTemplate({ 
  children,
  onSearch,
  onCategoryChange,
  categories = [],
  showSearch = true,
  userRole = 'user',
  onLogout,
  navItems = []
}: MarketplaceTemplateProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        items={navItems}
        onLogout={onLogout}
        userRole={userRole}
      />

      {showSearch && onSearch && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <SearchBar
              onSearch={onSearch}
              onCategoryChange={onCategoryChange}
              categories={categories}
              placeholder="Search products..."
              showCategoryFilter={categories.length > 0}
            />
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>

      <Toaster />
      
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>© 2025 HarvestHub. Fresh from farm to table.</p>
        </div>
      </footer>
    </div>
  );
}
