# KPI Dashboard

A comprehensive KPI visualization dashboard built with React + TypeScript + Tailwind CSS and pure SVG charts (no external chart libraries).

## Features

### 1. **Multi-Metric Support**
- **Index**: Project performance index (baseline 100)
- **Profit/Day**: Daily profit calculations (derived from index changes)
- **Time Saved**: Hours saved per project
- **Signals**: Combined PR and app event metrics

### 2. **Timeframe Filtering**
- 7 days
- 14 days  
- 30 days (default)

### 3. **Visualizations**

#### Header Stats
Three stat cards showing:
- Total aggregate for selected metric
- Average value across all projects
- Total number of projects

#### Multi-Series Line Chart
- Pure SVG implementation (no chart libraries)
- Responsive via viewBox
- Auto-scaling based on data range
- Grid lines and axes
- Color-coded series with legend
- Smooth line rendering

#### Per-Project Tiles
- Project symbol and name
- Last metric value
- Mini sparkline (60-point inline chart)
- Color-coded by project

### 4. **Data Flow**

Currently uses **mock data** from the ticker seed:
```typescript
const mockData = useMemo(() => generateTickerSeedData(), []);
```

**To swap to FastAPI backend:**

1. Create a custom hook:
```typescript
// src/hooks/useKPIData.ts
export function useKPIData() {
  const [data, setData] = useState<ProjectTickerDatum[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`${API_BASE}/api/metrics/kpi`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  
  return { data, loading };
}
```

2. Replace in `KPIPage.tsx`:
```typescript
// Replace:
const mockData = useMemo(() => generateTickerSeedData(), []);

// With:
const { data: mockData, loading } = useKPIData();
```

No component changes required!

## File Structure

```
frontend/src/
├── pages/
│   └── KPIPage.tsx              # Main KPI dashboard page
├── components/
│   ├── LineChartSVG.tsx         # Multi-series line chart (pure SVG)
│   └── Sparkline.tsx            # Tiny inline sparkline (reused from ticker)
├── lib/
│   ├── kpi.ts                   # KPI data transformation utilities
│   └── format.ts                # Number/currency formatting
└── mock/
    └── tickerSeed.ts            # Mock data generator (reused)
```

## Components

### `<KPIPage />`
Main dashboard page with:
- Metric and timeframe selectors
- Stat cards
- Multi-series chart
- Project breakdown tiles

**Props**: None (standalone route)

### `<LineChartSVG />`
Pure SVG multi-series line chart.

**Props**:
```typescript
interface LineChartSVGProps {
  series: ChartSeries[];  // Array of {name, data, color}
  width?: number;         // SVG width (default: 720)
  height?: number;        // SVG height (default: 220)
  padding?: number;       // Chart padding (default: 16)
}
```

**Features**:
- Auto-scaling to min/max
- Grid lines
- Axes with labels
- Responsive via viewBox
- Accessible (role="img", aria-label)

### `<Sparkline />`
Tiny inline sparkline chart (reused from ticker).

**Props**:
```typescript
interface SparklineProps {
  data: number[];
  width?: number;   // default: 96
  height?: number;  // default: 24
}
```

## Utilities

### `lib/kpi.ts`

```typescript
// Convert cumulative values to daily deltas
toDaily(values: number[]): number[]

// Get last N elements
lastN<T>(arr: T[], n: number): T[]

// Calculate total and average
kpiAggregates(items, metric, points): { total: number; avg: number }

// Get color class/hex for series by index
colorClass(i: number): string
strokeColor(i: number): string
```

### `lib/format.ts`

```typescript
// Format as currency ($12.3k, $4.5M)
fmtMoney(n: number): string

// Format as percentage (31.2%)
fmtPct(p: number): string

// Format with abbreviations (12.3k, 4.5M)
fmtNumber(n: number): string
```

## Metric Transformations

Each metric uses the same 30-point `indexSeries` but transforms it differently:

- **Index**: Direct use of `indexSeries`
- **Profit**: Daily deltas scaled by project profit
- **Time**: Flat distribution of `timeSavedHrs` across points
- **Signals**: Flat value from `(prs + appEvents)`

These are placeholders until real time-series data is available from the backend.

## Styling

- **Pure Tailwind CSS** (inline styles for dynamic values)
- **Color palette**: emerald, blue, amber, rose, violet, cyan (600 shades)
- **Responsive grids**: `repeat(auto-fit, minmax(..., 1fr))`
- **Card-based design**: white background, subtle shadows, rounded corners

## Accessibility

- All selects have proper `<label>` with `htmlFor`
- SVG charts have `role="img"` and `aria-label`
- Color-coded with sufficient contrast
- Keyboard navigable (native controls)

## Backend Integration

### Current (Mock)
```typescript
const mockData = useMemo(() => generateTickerSeedData(), []);
```

### Future (FastAPI)

**Endpoint**: `GET /api/metrics/kpi`

**Response**:
```json
[
  {
    "projectId": "proj-123",
    "symbol": "WBR",
    "name": "Web Redesign",
    "profit": 12300,
    "margin": 0.31,
    "timeSavedHrs": 14,
    "prs": 5,
    "appEvents": 12,
    "indexSeries": [100, 102, 101, ...] // 30 points
  },
  ...
]
```

**Implementation**:
1. Create `useKPIData()` hook
2. Replace `mockData` in `KPIPage.tsx`
3. Add loading/error states

**No other code changes required!** The dashboard is designed to be data-source agnostic.

## Performance

- **Memoization**: Data transformations are memoized with `useMemo`
- **Pure SVG**: No external chart library overhead
- **Efficient rendering**: Only re-renders when metric/timeframe changes
- **Responsive**: Uses CSS Grid with auto-fit for adaptive layouts

## Routes

Add to `App.tsx`:
```typescript
<Route path="/kpi" element={<KPIPage />} />
```

Access at: `http://localhost:5173/kpi`

## Development Notes

### Adding a New Metric

1. Add to `MetricType` union in `KPIPage.tsx`
2. Add transformation case in `transformedData` useMemo
3. Add option to metric selector
4. Add formatting logic to `formatValue()`

### Customizing Colors

Edit `strokeColor()` and `colorClass()` in `lib/kpi.ts`:
```typescript
export function strokeColor(i: number): string {
  const colors = [
    '#059669',  // your hex colors
    '#2563eb',
    // ...
  ];
  return colors[i % colors.length];
}
```

### Chart Customization

Adjust `LineChartSVG` props:
- `width`, `height`: SVG dimensions
- `padding`: Internal chart padding
- Grid lines: Edit loop in component (currently 5 lines)

## Known Limitations

1. **Mock data**: Currently uses synthetic 30-point series
2. **Metric transformations**: Placeholders until real time-series data available
3. **No zoom/pan**: Static chart view
4. **No tooltip**: Basic chart without interactive tooltips
5. **No data point markers**: Lines only (add circles in `LineChartSVG` if needed)

## Future Enhancements

- [ ] WebSocket for real-time updates
- [ ] Chart tooltips on hover
- [ ] Export chart as PNG/SVG
- [ ] Date range picker (calendar)
- [ ] Project filtering (multi-select)
- [ ] Comparison mode (side-by-side timeframes)
- [ ] Data point markers on chart
- [ ] Animated transitions
- [ ] Dark mode support

## Testing

```bash
# Run frontend
cd frontend
npm run dev

# Navigate to
http://localhost:5173/kpi

# Test:
1. Switch metrics (Index, Profit, Time, Signals)
2. Change timeframes (7, 14, 30 days)
3. Verify stat cards update
4. Verify chart updates
5. Verify project tiles update
6. Resize window (check responsiveness)
```

## Production Checklist

- [ ] Replace mock data with API call
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty state (no data)
- [ ] Performance testing with real data
- [ ] Cross-browser testing
- [ ] Mobile responsive testing
- [ ] Accessibility audit (WCAG AA)
- [ ] Analytics tracking

