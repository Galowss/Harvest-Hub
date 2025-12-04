'use client';

import { ReactNode } from 'react';
import { Navigation, UserNavItems, FarmerNavItems, GuestNavItems } from '@/components/organisms';
import { Toaster } from '@/components/atoms';

interface DashboardTemplateProps {
  children: ReactNode;
  userRole?: 'user' | 'farmer' | 'admin' | 'guest';
  onLogout?: () => void;
}

export function DashboardTemplate({ children, userRole = 'user', onLogout }: DashboardTemplateProps) {
  const getNavItems = () => {
    switch (userRole) {
      case 'farmer':
        return FarmerNavItems;
      case 'guest':
        return GuestNavItems;
      default:
        return UserNavItems;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        items={getNavItems()} 
        onLogout={onLogout}
        userRole={userRole}
      />
      
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>

      <Toaster />
      
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>© 2025 HarvestHub. Connecting farmers and consumers.</p>
        </div>
      </footer>
    </div>
  );
}
