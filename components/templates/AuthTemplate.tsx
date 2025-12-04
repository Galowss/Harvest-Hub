'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/atoms';

interface AuthTemplateProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthTemplate({ children, title, subtitle }: AuthTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-green-600 mb-2">
              🌾 HarvestHub
            </h1>
          </Link>
          {title && (
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          )}
          {subtitle && (
            <p className="text-gray-600 mt-2">{subtitle}</p>
          )}
        </div>

        {/* Content Card */}
        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8">
            {children}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2025 HarvestHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
