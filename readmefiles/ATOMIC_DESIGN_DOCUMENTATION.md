# Atomic Design Architecture

HarvestHub now follows **Atomic Design** principles for better component organization, reusability, and maintainability.

## 📁 Structure

```
/components/
├── atoms/              # Basic building blocks (buttons, inputs, labels)
├── molecules/          # Simple combinations (cards, search bars)
├── organisms/          # Complex sections (navigation, grids, lists)
├── templates/          # Page layouts (dashboard, auth, marketplace)
└── index.ts           # Central export point
```

## 🔬 Component Hierarchy

### Atoms
**Purpose:** Smallest, indivisible UI components  
**Location:** `/components/atoms/`  
**Re-exports from:** `/components/ui/` (shadcn/ui components)

```typescript
import { Button, Input, Label, Card, Badge } from '@/components/atoms';
```

**Available Atoms:**
- `Button` - Clickable buttons with variants
- `Input` - Text input fields
- `Label` - Form labels
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` - Card components
- `Badge` - Status badges
- `Alert`, `AlertDescription`, `AlertTitle` - Alert messages
- `Avatar`, `AvatarImage`, `AvatarFallback` - User avatars
- `Checkbox` - Checkboxes
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - Dropdowns
- `Textarea` - Multi-line text inputs
- `Separator` - Visual separators
- `Skeleton` - Loading placeholders
- `Switch` - Toggle switches
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` - Tab components
- `Toaster`, `useToast`, `toast` - Toast notifications

### Molecules
**Purpose:** Simple combinations of atoms  
**Location:** `/components/molecules/`

```typescript
import { ProductCard, OrderCard, SearchBar } from '@/components/molecules';
```

**Available Molecules:**

#### `ProductCard`
Displays product information with image, price, and actions.

```tsx
<ProductCard
  product={productData}
  onAddToCart={() => handleAdd(product.id)}
  onViewDetails={() => navigate(`/product/${product.id}`)}
  showActions={true}
/>
```

**Props:**
- `product` - Product data (id, name, price, stock, etc.)
- `onAddToCart?` - Add to cart handler
- `onViewDetails?` - View details handler
- `showActions?` - Show/hide action buttons

#### `OrderCard`
Displays order information with status, items, and dates.

```tsx
<OrderCard order={orderData} />
```

**Props:**
- `order` - Order data (id, status, items, dates, etc.)

#### `SearchBar`
Search input with optional category filter.

```tsx
<SearchBar
  onSearch={(query) => handleSearch(query)}
  onCategoryChange={(cat) => setCategory(cat)}
  categories={['Vegetables', 'Fruits', 'Grains']}
  placeholder="Search products..."
  showCategoryFilter={true}
/>
```

**Props:**
- `onSearch` - Search handler function
- `onCategoryChange?` - Category change handler
- `categories?` - Array of category names
- `placeholder?` - Input placeholder text
- `showCategoryFilter?` - Show category dropdown

### Organisms
**Purpose:** Complex UI sections composed of molecules and atoms  
**Location:** `/components/organisms/`

```typescript
import { ProductGrid, OrderList, Navigation } from '@/components/organisms';
```

**Available Organisms:**

#### `ProductGrid`
Grid layout of product cards with loading states.

```tsx
<ProductGrid
  products={productsData}
  onAddToCart={(id) => handleAddToCart(id)}
  onViewDetails={(id) => navigate(`/product/${id}`)}
  loading={isLoading}
  emptyMessage="No products available"
/>
```

**Props:**
- `products` - Array of product objects
- `onAddToCart?` - Add to cart handler
- `onViewDetails?` - View details handler
- `loading?` - Show loading skeletons
- `emptyMessage?` - Message when no products

#### `OrderList`
Vertical list of order cards.

```tsx
<OrderList
  orders={ordersData}
  loading={isLoading}
  emptyMessage="No orders found"
/>
```

**Props:**
- `orders` - Array of order objects
- `loading?` - Show loading skeletons
- `emptyMessage?` - Message when no orders

#### `Navigation`
Main navigation bar with role-based menu items.

```tsx
import { Navigation, UserNavItems, FarmerNavItems, GuestNavItems } from '@/components/organisms';

<Navigation
  items={UserNavItems}
  onLogout={() => handleLogout()}
  userRole="user"
/>
```

**Props:**
- `items` - Array of navigation items
- `onLogout?` - Logout handler
- `userRole?` - User role for styling

**Pre-defined Nav Sets:**
- `UserNavItems` - For regular users (8 items)
- `FarmerNavItems` - For farmers (9 items)
- `GuestNavItems` - For guests (2 items)

### Templates
**Purpose:** Page-level layouts combining organisms  
**Location:** `/components/templates/`

```typescript
import { DashboardTemplate, AuthTemplate, MarketplaceTemplate } from '@/components/templates';
```

**Available Templates:**

#### `DashboardTemplate`
Standard dashboard layout with navigation and footer.

```tsx
<DashboardTemplate
  userRole="user"
  onLogout={() => handleLogout()}
>
  {/* Your page content */}
</DashboardTemplate>
```

**Props:**
- `children` - Page content
- `userRole?` - User role ('user' | 'farmer' | 'guest')
- `onLogout?` - Logout handler

#### `AuthTemplate`
Authentication pages layout (login, signup).

```tsx
<AuthTemplate
  title="Welcome Back"
  subtitle="Sign in to your account"
>
  {/* Your form content */}
</AuthTemplate>
```

**Props:**
- `children` - Form content
- `title?` - Page title
- `subtitle?` - Page subtitle

#### `MarketplaceTemplate`
Product marketplace layout with search.

```tsx
<MarketplaceTemplate
  onSearch={(q) => handleSearch(q)}
  onCategoryChange={(cat) => setCategory(cat)}
  categories={['Vegetables', 'Fruits']}
  showSearch={true}
  userRole="user"
  onLogout={() => handleLogout()}
  navItems={UserNavItems}
>
  {/* Your marketplace content */}
</MarketplaceTemplate>
```

**Props:**
- `children` - Marketplace content
- `onSearch?` - Search handler
- `onCategoryChange?` - Category change handler
- `categories?` - Category array
- `showSearch?` - Show search bar
- `userRole?` - User role
- `onLogout?` - Logout handler
- `navItems?` - Navigation items

## 🎯 Usage Examples

### Before (Old Structure)
```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import OrderCard from '@/app/components/OrderCard';

function MyPage() {
  return (
    <div>
      <OrderCard order={data} />
    </div>
  );
}
```

### After (Atomic Design)
```tsx
import { DashboardTemplate } from '@/components/templates';
import { OrderList } from '@/components/organisms';
import { UserNavItems } from '@/components/organisms';

function MyPage() {
  return (
    <DashboardTemplate userRole="user" onLogout={handleLogout}>
      <OrderList orders={ordersData} loading={loading} />
    </DashboardTemplate>
  );
}
```

## ✅ Benefits

1. **Better Organization** - Clear component hierarchy
2. **Reusability** - Build once, use everywhere
3. **Consistency** - Same atoms used across all pages
4. **Maintainability** - Easy to update and test
5. **Scalability** - Add new features faster
6. **Type Safety** - Full TypeScript support
7. **Documentation** - Self-documenting structure

## 🔄 Migration Guide

### Step 1: Import from atomic structure
```typescript
// ❌ Old
import { Button } from '@/components/ui/button';

// ✅ New
import { Button } from '@/components/atoms';
```

### Step 2: Use templates for pages
```typescript
// ❌ Old - Manual layout
function Page() {
  return (
    <div>
      <Navbar />
      <main>{content}</main>
      <Footer />
    </div>
  );
}

// ✅ New - Use template
function Page() {
  return (
    <DashboardTemplate userRole="user">
      {content}
    </DashboardTemplate>
  );
}
```

### Step 3: Compose with organisms
```typescript
// ❌ Old - Manual mapping
{products.map(p => <ProductCard key={p.id} product={p} />)}

// ✅ New - Use organism
<ProductGrid products={products} onAddToCart={handleAdd} />
```

## 📦 Central Import

All atomic components can be imported from the main components folder:

```typescript
import {
  // Atoms
  Button, Input, Card,
  
  // Molecules
  ProductCard, SearchBar,
  
  // Organisms
  ProductGrid, Navigation,
  
  // Templates
  DashboardTemplate
} from '@/components';
```

## 🚀 Next Steps

1. ✅ Atomic structure created
2. ✅ Core components migrated
3. ⏳ Update existing pages to use templates
4. ⏳ Update all imports to atomic structure
5. ⏳ Remove old duplicate components
6. ⏳ Add Storybook for component documentation

## 📝 Component Development Guidelines

When creating new components:

1. **Atoms** - Create only if it's a truly basic UI element
2. **Molecules** - Combine 2-3 atoms for a specific purpose
3. **Organisms** - Combine molecules for a complex UI section
4. **Templates** - Create page layouts that can be reused

Always include:
- TypeScript interfaces for props
- JSDoc comments for documentation
- 'use client' directive when using hooks
- Responsive design (mobile-first)
- Loading and empty states
- Accessibility features

---

**HarvestHub** - Now with Atomic Design! 🌾✨
