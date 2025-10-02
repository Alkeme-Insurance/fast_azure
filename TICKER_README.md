# Project Ticker Bar

A production-ready stock-ticker style metrics bar for project tracking, built with React + TypeScript + Tailwind.

## Features

- **Stock-ticker style horizontal scrolling bar** with auto-scroll and pause-on-hover
- **Real-time updates** with configurable data sources (static/synth/WebSocket)
- **Responsive design** - compact on mobile, full KPIs on desktop
- **Accessible** - ARIA roles, labels, and semantic HTML
- **Pure SVG sparklines** - no chart library dependencies
- **Production-ready** - works with mocks today, swap to real API with zero UI changes

## Quick Start

### 1. Add Ticker to Your Page

```tsx
import { ProjectTickerBar } from '../components/ProjectTickerBar';
import { useTicker } from '../hooks/useTicker';

function Dashboard() {
  const { data, loading, error } = useTicker();

  if (loading) return <div>Loading metrics...</div>;
  if (error) return <div>Error loading metrics</div>;

  return (
    <div>
      <ProjectTickerBar data={data} autoScroll={true} scrollSpeed={30} />
      {/* Rest of your dashboard */}
    </div>
  );
}
```

### 2. Configure Data Source

Set the `VITE_METRICS_SOURCE` environment variable:

**Development (.env.development):**
```bash
VITE_METRICS_SOURCE=synth  # or 'static' for deterministic data
```

**Production (.env.production):**
```bash
VITE_METRICS_SOURCE=ws
VITE_API_BASE_URL=https://api.yourapp.com
VITE_WS_BASE=wss://api.yourapp.com
```

## Data Sources

### Static Mode (`VITE_METRICS_SOURCE=static`)
- Returns deterministic sample data
- No real-time updates
- Good for testing UI layout

### Synth Mode (`VITE_METRICS_SOURCE=synth`) **[Default]**
- Random-walk generator
- Updates every 3 seconds
- Simulates realistic market-like behavior
- Perfect for development and demos

### WebSocket Mode (`VITE_METRICS_SOURCE=ws`)
- Connects to real backend WebSocket
- Receives delta updates
- Production mode

## Backend Integration

### REST Endpoint

Implement this endpoint on your FastAPI backend:

```python
# GET /api/metrics/ticker
# Response: { "items": [ {...ProjectTickerDatum}, ... ] }

from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

class ProjectTickerDatum(BaseModel):
    projectId: str
    symbol: str
    name: str
    profit: float
    margin: float
    timeSavedHrs: float
    prs: int | None = None
    appEvents: int | None = None
    indexSeries: List[float]

router = APIRouter()

@router.get("/api/metrics/ticker")
async def get_ticker_data():
    # Fetch from Mongo or compute from projects/boards
    data = await compute_ticker_metrics()
    return {"items": data}
```

### WebSocket Endpoint (Optional)

For real-time updates:

```python
# WS /ws/metrics/ticker
# Message format: { "type": "delta", "deltas": [...TickerDelta] }

from fastapi import WebSocket

@router.websocket("/ws/metrics/ticker")
async def ticker_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Compute deltas (changed metrics)
            deltas = await get_metric_deltas()
            await websocket.send_json({
                "type": "delta",
                "deltas": deltas
            })
            await asyncio.sleep(3)  # Update interval
    except WebSocketDisconnect:
        pass
```

## Components

### `<ProjectTickerBar>`
Main container with auto-scroll logic.

**Props:**
- `data: ProjectTickerDatum[]` - Array of project metrics
- `autoScroll?: boolean` - Enable auto-scrolling (default: true)
- `scrollSpeed?: number` - Pixels per second (default: 30)

### `<ProjectTickerItem>`
Individual ticker item displaying one project's metrics.

### `<Sparkline>`
Pure SVG sparkline chart.

**Props:**
- `data: number[]` - Data points to plot
- `width?: number` - Width in pixels (default: 60)
- `height?: number` - Height in pixels (default: 24)
- `color?: string` - Line color
- `baseline?: number` - Baseline value (default: 100)

## Utilities

### `lib/ticker.ts`

- `toIndexSeries(rawValues)` - Normalize data to index (baseline=100)
- `fmtMoney(value)` - Format currency with k/M suffix
- `fmtPct(value)` - Format percentage
- `abbr(name)` - Generate 3-letter symbol from project name
- `getTrend(indexSeries)` - Get trend direction (up/down/flat)
- `getValueColor(current, baseline)` - Get color based on value vs baseline

## Data Model

```typescript
interface ProjectTickerDatum {
  projectId: string;
  symbol: string;      // e.g., "ECP"
  name: string;        // "E-Commerce Platform"
  profit: number;      // Latest daily profit in $
  margin: number;      // 0..1 (e.g., 0.31 = 31%)
  timeSavedHrs: number;
  prs?: number;        // Pull requests
  appEvents?: number;  // Application events
  indexSeries: number[]; // 30 points, normalized to base=100
}

interface TickerDelta {
  projectId: string;
  profit?: number;
  margin?: number;
  timeSavedHrs?: number;
  prs?: number;
  appEvents?: number;
  indexPoint?: number; // New point to append to series
}
```

## Responsive Behavior

- **Mobile (< 640px):** Symbol + Sparkline + Index only
- **Tablet (640px - 768px):** + Sparkline visible
- **Desktop (768px+):** Full KPI set (Profit, Margin, Time, Signals)

## Accessibility

- `role="list"` and `role="listitem"` for semantic structure
- `aria-label` attributes for all metrics
- Good color contrast (WCAG AA compliant)
- Keyboard navigation support

## Customization

### Styling

The ticker uses Tailwind classes. Key customization points:

- Background: `bg-white` in `ProjectTickerBar`
- Item styling: `bg-gray-50` in `ProjectTickerItem`
- Border: `border-gray-200`
- Text sizes: `text-xs`, `text-sm`

### Scroll Speed

Adjust via prop:
```tsx
<ProjectTickerBar data={data} scrollSpeed={50} /> // Faster
<ProjectTickerBar data={data} scrollSpeed={20} /> // Slower
```

### Update Interval

Edit `config/env.ts`:
```typescript
export const TICKER_UPDATE_INTERVAL = 5000; // 5 seconds
```

## Performance

- Uses `requestAnimationFrame` for smooth scrolling
- Efficient delta updates (only changed values)
- Maintains fixed history length (30 points default)
- Cleans up subscriptions and timers on unmount

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- WebSocket support required for `ws` mode
- Graceful fallback to static data on errors

## Troubleshooting

### Ticker not scrolling
- Check `autoScroll={true}` prop
- Ensure container has enough items to scroll
- Try hovering/un-hovering to unpause

### No data showing
- Check `VITE_METRICS_SOURCE` environment variable
- Verify API endpoint returns correct format
- Check browser console for errors

### WebSocket not connecting
- Verify `VITE_WS_BASE` is correct
- Check CORS settings on backend
- Ensure WebSocket endpoint is implemented

## Example Integration

See `frontend/src/pages/Home.tsx` for a complete example of integrating the ticker into your app.

---

**Built with:**
- React 18
- TypeScript
- Tailwind CSS
- No external chart libraries

