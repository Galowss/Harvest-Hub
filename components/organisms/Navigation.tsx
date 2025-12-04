'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/atoms';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Wallet, 
  Star, 
  User, 
  MapPin,
  Users,
  BarChart3,
  LogOut
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavigationProps {
  items: NavItem[];
  onLogout?: () => void;
  userRole?: 'user' | 'farmer' | 'admin' | 'guest';
}

export function Navigation({ items, onLogout, userRole }: NavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-green-600">🌾 HarvestHub</span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            
            {onLogout && userRole !== 'guest' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Pre-defined navigation sets for different user roles
export const UserNavItems: NavItem[] = [
  { href: '/dashboard/user', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { href: '/dashboard/user/cart', label: 'Cart', icon: <ShoppingCart className="h-4 w-4" /> },
  { href: '/dashboard/user/orders', label: 'Orders', icon: <Package className="h-4 w-4" /> },
  { href: '/dashboard/user/wallet', label: 'Wallet', icon: <Wallet className="h-4 w-4" /> },
  { href: '/dashboard/community', label: 'Community', icon: <Users className="h-4 w-4" /> },
  { href: '/dashboard/map', label: 'Farmer Map', icon: <MapPin className="h-4 w-4" /> },
  { href: '/dashboard/user/rate-farmer', label: 'Rate Farmer', icon: <Star className="h-4 w-4" /> },
  { href: '/dashboard/user/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
];

export const FarmerNavItems: NavItem[] = [
  { href: '/dashboard/farmer', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { href: '/dashboard/farmer/products', label: 'Products', icon: <Package className="h-4 w-4" /> },
  { href: '/dashboard/farmer/orders', label: 'Orders', icon: <ShoppingCart className="h-4 w-4" /> },
  { href: '/dashboard/farmer/wallet', label: 'Wallet', icon: <Wallet className="h-4 w-4" /> },
  { href: '/dashboard/farmer/analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { href: '/dashboard/community', label: 'Community', icon: <Users className="h-4 w-4" /> },
  { href: '/dashboard/map', label: 'Farmer Map', icon: <MapPin className="h-4 w-4" /> },
  { href: '/dashboard/farmer/ratings', label: 'Ratings', icon: <Star className="h-4 w-4" /> },
  { href: '/dashboard/farmer/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
];

export const GuestNavItems: NavItem[] = [
  { href: '/dashboard/user', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { href: '/dashboard/community', label: 'Community Hub', icon: <Users className="h-4 w-4" /> },
];
