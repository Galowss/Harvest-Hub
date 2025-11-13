// Service to fetch and process DA Philippines price monitoring data
// Note: This is a mock implementation since direct scraping requires backend proxy
// In production, you would need a backend API to fetch and cache this data

export interface DAPriceData {
  commodity: string;
  category: string;
  price: number;
  unit: string;
  prevPrice?: number;
  region?: string;
  dateUpdated: Date;
}

export interface MarketForecast {
  commodity: string;
  category: string;
  currentPrice: number;
  predictedPrices: {
    oneWeek: number;
    twoWeeks: number;
    oneMonth: number;
  };
  demand: 'high' | 'medium' | 'low';
  optimalSalePeriod: string;
  confidence: number;
  priceDirection: 'rising' | 'falling' | 'stable';
  recommendation: string;
}

// Mock DA price data (in production, this would come from actual DA API/scraping)
const mockDAPrices: DAPriceData[] = [
  // Vegetables
  { commodity: 'Tomato', category: 'vegetables', price: 80, unit: 'kg', prevPrice: 75, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Cabbage', category: 'vegetables', price: 45, unit: 'kg', prevPrice: 48, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Eggplant', category: 'vegetables', price: 60, unit: 'kg', prevPrice: 58, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'String Beans', category: 'vegetables', price: 70, unit: 'kg', prevPrice: 72, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Squash', category: 'vegetables', price: 35, unit: 'kg', prevPrice: 38, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Bitter Gourd (Ampalaya)', category: 'vegetables', price: 90, unit: 'kg', prevPrice: 85, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Okra', category: 'vegetables', price: 65, unit: 'kg', prevPrice: 63, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Carrots', category: 'vegetables', price: 75, unit: 'kg', prevPrice: 73, region: 'NCR', dateUpdated: new Date() },
  
  // Fruits
  { commodity: 'Banana (Lakatan)', category: 'fruits', price: 55, unit: 'kg', prevPrice: 52, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Mango', category: 'fruits', price: 120, unit: 'kg', prevPrice: 115, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Papaya', category: 'fruits', price: 40, unit: 'kg', prevPrice: 42, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Pineapple', category: 'fruits', price: 50, unit: 'kg', prevPrice: 48, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Watermelon', category: 'fruits', price: 30, unit: 'kg', prevPrice: 32, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Calamansi', category: 'fruits', price: 150, unit: 'kg', prevPrice: 145, region: 'NCR', dateUpdated: new Date() },
  
  // Grains & Rice
  { commodity: 'Rice (Well-milled)', category: 'grains', price: 50, unit: 'kg', prevPrice: 49, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Rice (Regular Milled)', category: 'grains', price: 45, unit: 'kg', prevPrice: 44, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Corn Grits', category: 'grains', price: 38, unit: 'kg', prevPrice: 40, region: 'NCR', dateUpdated: new Date() },
  
  // Herbs & Spices
  { commodity: 'Ginger', category: 'herbs', price: 180, unit: 'kg', prevPrice: 175, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Garlic', category: 'herbs', price: 200, unit: 'kg', prevPrice: 195, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Onion (Red)', category: 'herbs', price: 85, unit: 'kg', prevPrice: 90, region: 'NCR', dateUpdated: new Date() },
  { commodity: 'Onion (White)', category: 'herbs', price: 75, unit: 'kg', prevPrice: 78, region: 'NCR', dateUpdated: new Date() },
];

/**
 * Fetch current market prices from DA Philippines
 * In production, this would call a backend API that scrapes DA website
 */
export async function fetchDAPrices(): Promise<DAPriceData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production, you would:
  // 1. Call your backend API
  // 2. Backend scrapes https://www.da.gov.ph/price-monitoring/
  // 3. Parse Excel/CSV files from daily price index
  // 4. Return structured data
  
  return mockDAPrices;
}

/**
 * Get price data for a specific category
 */
export function getPricesByCategory(prices: DAPriceData[], category: string): DAPriceData[] {
  return prices.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

/**
 * AI-based market forecasting using simple time series analysis
 * In production, this would use machine learning models
 */
export function generateMarketForecast(
  commodity: string,
  currentPrice: number,
  historicalPrices: number[] = [],
  category: string = 'vegetables'
): MarketForecast {
  // Simple trend analysis
  const priceChange = historicalPrices.length >= 2 
    ? ((currentPrice - historicalPrices[historicalPrices.length - 2]) / historicalPrices[historicalPrices.length - 2]) * 100
    : 0;
  
  // Determine price direction
  let priceDirection: 'rising' | 'falling' | 'stable' = 'stable';
  if (priceChange > 3) priceDirection = 'rising';
  else if (priceChange < -3) priceDirection = 'falling';
  
  // Calculate moving average for smoothing
  const recentPrices = historicalPrices.slice(-4);
  const movingAverage = recentPrices.length > 0
    ? recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
    : currentPrice;
  
  // Predict future prices with seasonal adjustments
  const seasonalFactor = getSeasonalFactor(new Date().getMonth(), category);
  const volatilityFactor = calculateVolatility(historicalPrices);
  
  const oneWeekPrediction = currentPrice * (1 + (priceChange / 100) * 0.5) * seasonalFactor;
  const twoWeeksPrediction = currentPrice * (1 + (priceChange / 100) * 0.8) * seasonalFactor;
  const oneMonthPrediction = currentPrice * (1 + (priceChange / 100) * 1.2) * seasonalFactor;
  
  // Demand prediction based on price trends and seasonality
  let demand: 'high' | 'medium' | 'low' = 'medium';
  if (priceDirection === 'rising' && seasonalFactor > 1.05) demand = 'high';
  else if (priceDirection === 'falling' && seasonalFactor < 0.95) demand = 'low';
  
  // Optimal sale period recommendation
  let optimalSalePeriod = 'Current week';
  if (priceDirection === 'rising') {
    optimalSalePeriod = 'Wait 1-2 weeks for better prices';
  } else if (priceDirection === 'falling') {
    optimalSalePeriod = 'Sell immediately before prices drop further';
  }
  
  // Confidence based on data quality and volatility
  const confidence = Math.max(60, Math.min(95, 85 - (volatilityFactor * 10)));
  
  // Generate recommendation
  let recommendation = '';
  if (demand === 'high' && priceDirection === 'rising') {
    recommendation = '📈 Strong market! Hold for higher prices if possible.';
  } else if (demand === 'high' && priceDirection === 'stable') {
    recommendation = '✅ Good time to sell. Stable demand with fair prices.';
  } else if (demand === 'low' || priceDirection === 'falling') {
    recommendation = '⚠️ Market slowing. Consider selling soon or storing.';
  } else {
    recommendation = '📊 Moderate market. Monitor prices closely.';
  }
  
  return {
    commodity,
    category,
    currentPrice,
    predictedPrices: {
      oneWeek: parseFloat(oneWeekPrediction.toFixed(2)),
      twoWeeks: parseFloat(twoWeeksPrediction.toFixed(2)),
      oneMonth: parseFloat(oneMonthPrediction.toFixed(2)),
    },
    demand,
    optimalSalePeriod,
    confidence: parseFloat(confidence.toFixed(1)),
    priceDirection,
    recommendation,
  };
}

/**
 * Calculate seasonal factor based on month and category
 */
function getSeasonalFactor(month: number, category: string): number {
  // Philippines seasonal patterns
  // Wet season: June-November, Dry season: December-May
  
  const seasonalPatterns: { [key: string]: number[] } = {
    vegetables: [1.05, 1.08, 1.10, 1.05, 1.00, 0.95, 0.90, 0.92, 0.95, 0.98, 1.00, 1.03],
    fruits: [0.95, 0.98, 1.05, 1.10, 1.08, 1.00, 0.95, 0.93, 0.95, 0.98, 1.00, 1.02],
    grains: [1.00, 1.00, 1.02, 1.03, 1.05, 1.00, 0.98, 0.97, 0.98, 1.00, 1.01, 1.00],
    herbs: [1.03, 1.05, 1.08, 1.10, 1.05, 1.00, 0.95, 0.93, 0.95, 0.98, 1.00, 1.02],
  };
  
  const pattern = seasonalPatterns[category.toLowerCase()] || seasonalPatterns.vegetables;
  return pattern[month];
}

/**
 * Calculate price volatility
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  
  return mean > 0 ? (stdDev / mean) : 0;
}

/**
 * Match user product to DA commodity data
 */
export function matchProductToDAData(
  productName: string,
  productCategory: string,
  daPrices: DAPriceData[]
): DAPriceData | null {
  const normalizedProductName = productName.toLowerCase();
  
  // Try exact match first
  let match = daPrices.find(p => 
    p.commodity.toLowerCase() === normalizedProductName &&
    p.category.toLowerCase() === productCategory.toLowerCase()
  );
  
  if (match) return match;
  
  // Try partial match
  match = daPrices.find(p => 
    normalizedProductName.includes(p.commodity.toLowerCase()) ||
    p.commodity.toLowerCase().includes(normalizedProductName)
  );
  
  if (match) return match;
  
  // Fall back to category average
  const categoryPrices = daPrices.filter(p => 
    p.category.toLowerCase() === productCategory.toLowerCase()
  );
  
  if (categoryPrices.length > 0) {
    const avgPrice = categoryPrices.reduce((sum, p) => sum + p.price, 0) / categoryPrices.length;
    return {
      commodity: productName,
      category: productCategory,
      price: avgPrice,
      unit: 'kg',
      region: 'NCR',
      dateUpdated: new Date(),
    };
  }
  
  return null;
}

/**
 * Generate historical price data (mock - in production, fetch from database)
 */
export function generateHistoricalPrices(basePrice: number, weeks: number = 8): number[] {
  const prices: number[] = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < weeks; i++) {
    // Add random variation (-10% to +10%)
    const variation = (Math.random() - 0.5) * 0.2;
    currentPrice = currentPrice * (1 + variation);
    prices.push(parseFloat(currentPrice.toFixed(2)));
  }
  
  return prices;
}
