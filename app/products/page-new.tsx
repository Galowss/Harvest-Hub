import { Metadata } from 'next';
import { fetchSSR } from '@/lib/dataFetching';
import ProductsClient from './ProductsClient';

// SEO Metadata
export const metadata: Metadata = {
  title: 'Products | Harvest Hub - Fresh Farm Produce',
  description: 'Browse fresh, organic produce directly from local farmers. Support sustainable agriculture with Harvest Hub.',
  keywords: ['fresh produce', 'organic farming', 'local farmers', 'sustainable agriculture'],
  openGraph: {
    title: 'Products | Harvest Hub',
    description: 'Browse fresh, organic produce directly from local farmers.',
    images: [{ url: '/harvest-hub-logo.png', alt: 'Harvest Hub' }],
  },
};

interface Product {
  id: string;
  photo: string | null;
  name: string;
  description: string;
  price: number;
  category?: string;
  farmerId?: string;
  stock?: number;
}

// Server Component - Fetches data using SSR
async function getProducts(): Promise<Product[]> {
  try {
    // In a real app, this would fetch from your API
    // Using SSR because product availability changes frequently
    // const products = await fetchSSR<Product[]>('/api/products');
    
    // Mock data for now
    return [
      {
        id: '1',
        photo: null,
        name: 'Fresh Tomatoes',
        description: 'Locally grown organic tomatoes, perfect for salads and cooking.',
        price: 4.99,
        category: 'Vegetables',
        stock: 50,
      },
      {
        id: '2',
        photo: null,
        name: 'Sweet Corn',
        description: 'Farm-fresh sweet corn, harvested this morning.',
        price: 3.49,
        category: 'Vegetables',
        stock: 30,
      },
      {
        id: '3',
        photo: null,
        name: 'Organic Lettuce',
        description: 'Crisp organic lettuce grown without pesticides.',
        price: 2.99,
        category: 'Vegetables',
        stock: 40,
      },
    ];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export default async function ProductsPage() {
  // Fetch products on the server
  const products = await getProducts();

  return <ProductsClient products={products} />;
}

// Enable dynamic rendering (SSR)
export const dynamic = 'force-dynamic';
