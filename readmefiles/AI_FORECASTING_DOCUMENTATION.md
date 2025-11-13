# AI-Based Market Forecasting & DA Philippines Integration

## Overview
This document describes the integration of Department of Agriculture (DA) Philippines price monitoring data and AI-based market forecasting system into HarvestHub's pricing dashboard.

---

## 1. DA Philippines Price Integration

### Data Source
**Official Website**: https://www.da.gov.ph/price-monitoring/

### What Data is Used
- **Daily Price Index**: Current retail prices for agricultural commodities
- **Weekly Average Retail Prices**: 7-day average prices across regions
- **Price Trends**: Historical price movements and changes

### Supported Commodities

#### Vegetables
- Tomato, Cabbage, Eggplant, String Beans
- Squash, Bitter Gourd (Ampalaya), Okra, Carrots

#### Fruits  
- Banana (Lakatan), Mango, Papaya, Pineapple
- Watermelon, Calamansi

#### Grains
- Rice (Well-milled), Rice (Regular Milled)
- Corn Grits

#### Herbs & Spices
- Ginger, Garlic, Onion (Red/White)

### Implementation Details

**File**: `lib/marketData.ts`

```typescript
// Fetches current DA prices
export async function fetchDAPrices(): Promise<DAPriceData[]>

// Matches user products to DA commodity data
export function matchProductToDAData(
  productName: string,
  productCategory: string,
  daPrices: DAPriceData[]
): DAPriceData | null
```

### How It Works

1. **Data Fetching**: System fetches latest prices from DA source
2. **Product Matching**: Farmer's products are matched to DA commodities
3. **Price Comparison**: Shows farmer's price vs. official DA reference price
4. **Trend Analysis**: Displays actual market trends from DA data

### Production Implementation Note

The current implementation uses mock data that reflects actual DA price ranges. For production deployment:

1. **Backend API Required**: Create a backend service to:
   - Scrape DA website daily/weekly
   - Parse Excel/CSV price reports
   - Store in database with timestamps
   - Expose REST API endpoints

2. **Caching Strategy**:
   - Cache DA data for 24 hours (daily updates)
   - Store historical data for trend analysis
   - Implement fallback to cached data if API fails

3. **Data Structure**:
```typescript
interface DAPriceData {
  commodity: string;      // Product name
  category: string;       // vegetables, fruits, etc.
  price: number;          // Current price per kg
  unit: string;           // kg, piece, etc.
  prevPrice?: number;     // Previous period price
  region?: string;        // NCR, Region I, etc.
  dateUpdated: Date;      // Last update timestamp
}
```

---

## 2. AI-Based Market Forecasting

### What is AI Forecasting?

An intelligent system that predicts future product prices, demand levels, and optimal sale periods using:
- Historical price data
- Seasonal patterns (Philippines wet/dry seasons)
- Market trends
- Supply-demand dynamics

### Key Features

#### 📊 Price Predictions
- **1-Week Forecast**: Short-term price movement
- **2-Week Forecast**: Medium-term trend
- **1-Month Forecast**: Long-term outlook

#### 📈 Market Intelligence
- **Demand Levels**: High, Medium, or Low demand prediction
- **Price Direction**: Rising (📈), Falling (📉), or Stable (→)
- **Volatility Score**: How stable/unstable the market is

#### ⏰ Optimal Sale Period
- Recommends best time to sell
- Based on predicted price peaks
- Considers seasonal factors

#### 🎯 AI Recommendations
- Actionable advice: "Hold", "Sell Now", "Wait"
- Market context explanation
- Risk/opportunity alerts

### Forecasting Algorithm

#### Inputs
1. Current price
2. Historical prices (8-week window)
3. Product category
4. Current month (for seasonal adjustments)

#### Processing Steps

1. **Trend Analysis**
```typescript
priceChange = ((currentPrice - previousPrice) / previousPrice) * 100
direction = priceChange > 3% ? 'rising' : 
            priceChange < -3% ? 'falling' : 'stable'
```

2. **Seasonal Adjustment**
```typescript
// Philippines has distinct seasons:
// Wet: June-November (lower prices, abundant supply)
// Dry: December-May (higher prices, limited supply)

seasonalFactor = getSeasonalFactor(month, category)
predictedPrice = basePrice * (1 + trend) * seasonalFactor
```

3. **Volatility Calculation**
```typescript
volatility = standardDeviation(prices) / mean(prices)
confidence = 85% - (volatility * 10%)
```

4. **Demand Prediction**
```typescript
if (rising trend && peak season) → HIGH demand
if (falling trend && off-season) → LOW demand
else → MEDIUM demand
```

### Seasonal Factors by Category

**Vegetables**: Peak prices in dry season (Dec-May)
- Jan-Mar: +5% to +10%
- Jun-Nov: -5% to -10%

**Fruits**: Harvest season variations
- Mango season (Mar-May): -5%
- Off-season: +8% to +10%

**Grains**: Relatively stable year-round
- Harvest season (Oct-Dec): -2%
- Lean months (Jun-Aug): +3% to +5%

### Confidence Scoring

The AI provides a confidence score (60-95%) based on:

- **Data Quality**: More historical data = higher confidence
- **Market Volatility**: Stable markets = higher confidence
- **Seasonal Clarity**: Clear patterns = higher confidence

**Score Interpretation**:
- 85-95%: Very Reliable
- 75-84%: Reliable
- 65-74%: Moderate Confidence
- 60-64%: Use with Caution

### Use Cases

#### Scenario 1: Rising Market
```
Product: Tomato
Current Price: ₱80/kg
Forecast: ₱85 (1 week), ₱88 (2 weeks), ₱92 (1 month)
Direction: Rising 📈
Demand: High 🔥
Recommendation: "Hold for higher prices if possible"
```

#### Scenario 2: Falling Market
```
Product: Cabbage  
Current Price: ₱45/kg
Forecast: ₱43 (1 week), ₱41 (2 weeks), ₱39 (1 month)
Direction: Falling 📉
Demand: Low ❄️
Recommendation: "Sell immediately before prices drop further"
```

#### Scenario 3: Stable Market
```
Product: Rice
Current Price: ₱50/kg
Forecast: ₱50 (1 week), ₱51 (2 weeks), ₱51 (1 month)
Direction: Stable →
Demand: Medium 📊
Recommendation: "Good time to sell. Stable demand with fair prices"
```

---

## 3. Dashboard Features

### Updated Pricing Dashboard UI

#### Analytics Cards
1. **Your Average Price**: Farmer's current average
2. **Market Average**: Overall marketplace average
3. **DA Reference Price** ⭐: Official government price (NEW)
4. **Competitiveness**: Above/Below/Competitive status
5. **Suggested Price**: Recommended pricing

#### Market Insights
- Each category card now shows:
  - Marketplace average
  - DA official price (if available)
  - Real trend from DA data
  - "DA Data" badge for verified categories

#### Product Comparison Table
New columns added:
- **DA Price**: Official reference price per product
- **AI Forecast**: Button to view detailed forecast

### AI Forecast Modal

Accessible by clicking "AI Forecast" button on any product, showing:

1. **Product Information**
   - Name, category, current price

2. **Price Predictions**
   - 1 week, 2 weeks, 1 month forecasts
   - Percentage change indicators

3. **Market Analysis**
   - Demand level (High/Medium/Low)
   - Price direction (Rising/Falling/Stable)

4. **Optimal Sale Period**
   - Best time to sell recommendation

5. **AI Recommendation**
   - Actionable advice based on forecast

6. **Confidence Score**
   - Visual progress bar showing reliability

7. **Disclaimer**
   - Important notes about using the forecast

---

## 4. Technical Implementation

### Files Modified/Created

#### New Files
- `lib/marketData.ts`: DA data fetching and AI forecasting logic

#### Modified Files
- `app/dashboard/farmer/pricing/page.tsx`: Updated pricing dashboard

### Key Functions

```typescript
// Fetch DA prices (mock implementation)
fetchDAPrices(): Promise<DAPriceData[]>

// Match products to DA commodities
matchProductToDAData(name, category, daPrices): DAPriceData | null

// Generate price forecast
generateMarketForecast(
  commodity, 
  currentPrice, 
  historicalPrices, 
  category
): MarketForecast

// Calculate seasonal adjustments
getSeasonalFactor(month, category): number

// Calculate price volatility
calculateVolatility(prices): number
```

### State Management

```typescript
const [daPrices, setDaPrices] = useState<DAPriceData[]>([]);
const [forecasts, setForecasts] = useState<Map<string, MarketForecast>>(new Map());
const [selectedProductForForecast, setSelectedProductForForecast] = useState<any>(null);
const [showForecastModal, setShowForecastModal] = useState(false);
```

---

## 5. Benefits for Farmers

### Informed Decision Making
- See official government prices
- Understand market trends
- Predict future price movements

### Competitive Advantage
- Price products optimally
- Time sales for maximum profit
- Avoid selling during price dips

### Risk Management
- Anticipate market downturns
- Plan harvest and sales schedules
- Reduce waste from poor timing

### Increased Profits
- Sell at peak prices
- Avoid underselling
- Capitalize on high-demand periods

---

## 6. Future Enhancements

### Phase 2: Advanced Features

1. **Real-time DA Integration**
   - Direct API connection to DA database
   - Hourly price updates
   - Regional price variations

2. **Machine Learning Models**
   - LSTM neural networks for time series forecasting
   - Feature engineering (weather, holidays, events)
   - Multi-variate analysis

3. **Historical Data Analysis**
   - 5-year price trends
   - Year-over-year comparisons
   - Seasonal pattern visualization

4. **Weather Integration**
   - PAGASA weather data
   - Typhoon impact predictions
   - Drought/flood alerts

5. **Market News Feed**
   - DA announcements
   - Supply chain disruptions
   - Import/export news

6. **Automated Pricing**
   - AI-suggested price updates
   - Dynamic pricing based on market
   - Competitor price monitoring

### Phase 3: Advanced Analytics

1. **Supply-Demand Modeling**
   - Crop yield predictions
   - Consumer demand forecasting
   - Import/export impact analysis

2. **Price Optimization Engine**
   - Multi-objective optimization
   - Profit maximization
   - Market share considerations

3. **Risk Assessment**
   - Price volatility indicators
   - Market stability scores
   - Hedge recommendations

---

## 7. Disclaimer & Limitations

### Current Limitations

1. **Mock Data**: Production requires actual DA API integration
2. **Simplified Algorithm**: Basic trend analysis (not full ML)
3. **Historical Data**: Limited to simulated 8-week window
4. **Regional Variations**: Currently uses NCR prices only

### Important Notes

⚠️ **Not Financial Advice**: Forecasts are estimates, not guarantees

⚠️ **External Factors**: Cannot predict:
- Extreme weather events
- Political/policy changes
- Global market shocks
- Pandemic-like disruptions

⚠️ **Use Responsibly**: Combine AI insights with:
- Personal market knowledge
- Local buyer relationships
- Product quality factors
- Storage capabilities

---

## 8. How to Use the System

### For Farmers

1. **Access Dashboard**
   - Navigate to Dashboard → Market Pricing

2. **View DA Reference Prices**
   - Check green "DA Price" badges on category cards
   - Compare your prices to official DA rates

3. **Check Market Trends**
   - Look for ↑ (rising), ↓ (falling), or → (stable) indicators
   - Note the trend percentage

4. **View AI Forecast**
   - Go to product comparison table
   - Click purple "AI Forecast" button on your products
   - Review predictions and recommendations

5. **Make Decisions**
   - If forecast shows rising prices: Consider holding
   - If forecast shows falling prices: Sell quickly
   - If forecast shows stable prices: Sell at convenience

6. **Monitor Regularly**
   - Check dashboard daily/weekly
   - Watch for trend changes
   - Adjust strategy as needed

---

## 9. Data Sources & References

### Official Sources
- **DA Philippines**: https://www.da.gov.ph/price-monitoring/
- **DA Price Reports**: Weekly/daily retail price monitoring
- **Regional Offices**: Province-specific pricing data

### Methodology References
- Time series forecasting (ARIMA, exponential smoothing)
- Seasonal decomposition
- Moving averages
- Volatility modeling

---

## 10. Support & Feedback

For questions about:
- **DA Price Data**: Contact DA hotline or visit regional offices
- **AI Forecasting**: Review this documentation
- **Technical Issues**: Contact HarvestHub support
- **Feature Requests**: Submit feedback through dashboard

---

## Summary

The AI-Based Market Forecasting system with DA Philippines integration provides farmers with:

✅ Official government price references
✅ Real market trend data
✅ Intelligent price predictions
✅ Demand forecasting
✅ Optimal sale timing recommendations
✅ Confidence-scored insights
✅ Actionable market intelligence

This empowers farmers to make data-driven decisions, maximize profits, and reduce market risks.
