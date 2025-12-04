// Atomic Design Structure
// Export all atomic design components from centralized location

// Atoms - Basic UI building blocks
export * from './atoms';

// Molecules - Simple component combinations
export * from './molecules';

// Organisms - Complex UI sections
export * from './organisms';

// Templates - Page layouts
export * from './templates';

// Legacy components (to be migrated)
export { default as ClientOnly } from './ClientOnly';
export { ProductImage } from './ProductImage';
