# Metrics Model & Formulas

This document defines the defensible, auditable formulas used across the Fast Azure platform for calculating project value metrics.

## Core Principle

All metrics are derived from **measurable inputs** with **transparent calculations** that stakeholders can verify and audit.

---

## 📊 Core Metrics

### 1. Revenue

**Formula:**
```
Revenue = billable_hours × billable_rate
```

**Inputs:**
- `billable_hours`: Hours billed to client or internal stakeholder (hours)
- `billable_rate`: Hourly billing rate ($/hour)

**Example:**
```
billable_hours = 40 hours
billable_rate = $150/hour
Revenue = 40 × $150 = $6,000
```

**Notes:**
- For internal projects, use shadow pricing (market rate for similar services)
- Track billable hours separately from actual hours worked

---

### 2. Cost

**Formula:**
```
Cost = (actual_hours × cost_rate) + fixed_costs
```

**Inputs:**
- `actual_hours`: Total time spent on project (manual + automated)
- `cost_rate`: Fully-loaded internal cost per hour ($/hour)
- `fixed_costs`: Infrastructure, licenses, tools, etc. ($/period)

**Example:**
```
actual_hours = 32 hours (28 manual + 4 automated)
cost_rate = $85/hour
fixed_costs = $200 (CI/CD, cloud resources, licenses)
Cost = (32 × $85) + $200 = $2,720 + $200 = $2,920
```

**Notes:**
- `cost_rate` should include salary, benefits, overhead
- `fixed_costs` are amortized daily/weekly based on project duration
- Automated time is small but high-leverage (track separately for ROI analysis)

---

### 3. Profit

**Formula:**
```
Profit = Revenue - Cost
```

**Can be calculated:**
- **Daily**: Track daily revenue and cost
- **Cumulative**: Sum over project lifetime

**Example:**
```
Revenue = $6,000
Cost = $2,920
Profit = $6,000 - $2,920 = $3,080
```

**Notes:**
- Primary value metric
- Can be negative (project running at loss)
- Delta = current_profit - baseline_profit for improvement tracking

---

### 4. Profit Margin

**Formula:**
```
Margin = Profit / Revenue
```

**Output:** Decimal (0..1), typically displayed as percentage

**Example:**
```
Profit = $3,080
Revenue = $6,000
Margin = $3,080 / $6,000 = 0.513 = 51.3%
```

**Notes:**
- Higher is better
- Industry benchmarks vary (consulting: 20-40%, software: 60-80%)
- Negative margins indicate unprofitable projects

---

### 5. Time Saved

**Formula:**
```
Time Saved = baseline_hours - actual_hours
```

**Inputs:**
- `baseline_hours`: Historical mean or "before automation" estimate
- `actual_hours`: Actual time spent (manual + automated)

**Example:**
```
baseline_hours = 50 hours (historical average for similar projects)
actual_hours = 32 hours (28 manual + 4 automated)
Time Saved = 50 - 32 = 18 hours
```

**Notes:**
- Positive value = efficiency gain
- Negative value = project took longer than baseline
- For new work without baseline, use industry standards or expert estimates

---

### 6. Automation Lift

**Formula:**
```
Automation Lift = time_saved / baseline_hours
```

**Output:** Percentage improvement

**Example:**
```
time_saved = 18 hours
baseline_hours = 50 hours
Automation Lift = 18 / 50 = 0.36 = 36%
```

**Notes:**
- Measures effectiveness of automation
- High lift projects are candidates for further automation investment

---

### 7. Development Signal

**Formula:**
```
dev_signal = w₁×PRs + w₂×commits + w₃×lead_time_improvement + w₄×cycle_time_improvement
```

**Default Weights:**
- `w₁ = 3` (Pull Requests)
- `w₂ = 1` (Commits)
- `w₃ = 5` (Lead Time Improvement, percentage points)
- `w₄ = 5` (Cycle Time Improvement, percentage points)

**Example:**
```
PRs = 5
commits = 23
lead_time_improvement = 15% (reduced by 15 percentage points)
cycle_time_improvement = 20% (reduced by 20 percentage points)

dev_signal = (3×5) + (1×23) + (5×15) + (5×20)
           = 15 + 23 + 75 + 100
           = 213
```

**Notes:**
- Proxy for development velocity and quality
- Higher is better (more throughput, faster delivery)
- Customize weights based on team priorities

---

### 8. Operations Signal

**Formula:**
```
ops_signal = Σ(app_usage_events)
```

**Event Types:**
- Form submissions
- Job runs
- API calls
- User actions
- System events

**Example:**
```
form_submissions = 45
job_runs = 120
api_calls = 3,200
ops_signal = 45 + 120 + 3,200 = 3,365
```

**Notes:**
- Proxy for operational impact
- Higher = more system usage/value delivered
- Weight critical events higher if needed

---

### 9. Combined Signals

**Formula:**
```
total_signals = dev_signal + ops_signal
```

**Example:**
```
dev_signal = 213
ops_signal = 3,365
total_signals = 213 + 3,365 = 3,578
```

**Display Format:** `PR:5 • App:3,365`

**Notes:**
- Holistic view of project activity
- Can normalize by team size or project duration

---

### 10. Index Series

**Formula:**
```
indexSeries = toIndexSeries(<chosen metric>)

Where:
  toIndexSeries(values) = (values / baseline_value) × 100
```

**Purpose:** Normalize any metric to baseline=100 for trend visualization

**Example:**
```
profit_series = [2500, 2800, 3000, 3080, 2950]
baseline = 2500 (first value or average)

index_series = [
  (2500/2500)×100 = 100,
  (2800/2500)×100 = 112,
  (3000/2500)×100 = 120,
  (3080/2500)×100 = 123.2,
  (2950/2500)×100 = 118
]
```

**Notes:**
- Baseline=100 is neutral reference
- Values >100 = improvement
- Values <100 = decline
- Use for sparklines and trend charts

---

## 📈 Aggregation Across Projects

When viewing portfolio or team-level metrics:

### Total Revenue
```
Total Revenue = Σ(project_i.revenue)
```

### Total Cost
```
Total Cost = Σ(project_i.cost)
```

### Total Profit
```
Total Profit = Total Revenue - Total Cost
```

### Overall Margin
```
Overall Margin = Total Profit / Total Revenue
```

### Total Time Saved
```
Total Time Saved = Σ(project_i.time_saved)
```

### Average Metrics
```
Average Profit = Total Profit / number_of_projects
Average Margin = mean(project_i.margin)
```

**Notes:**
- Portfolio margin should be calculated from totals, not averaged
- Time saved is additive (can sum across projects)
- Signals can be summed or averaged depending on use case

---

## 🎯 Data Collection Requirements

To calculate these metrics, you need to track:

### Per Project:
1. **Time Tracking:**
   - Billable hours
   - Actual hours (manual)
   - Automated time (optional but valuable)
   - Baseline hours (historical or estimated)

2. **Financial:**
   - Billable rate ($/hour)
   - Cost rate ($/hour, fully-loaded)
   - Fixed costs ($/period)

3. **Development Activity:**
   - Pull requests
   - Commits
   - Lead time (issue-to-deploy)
   - Cycle time (code-to-deploy)

4. **Operations Activity:**
   - App usage events
   - Job runs
   - API calls
   - User actions

### Data Sources:
- **Time**: Jira, Azure DevOps, manual timesheets
- **Financial**: Finance/accounting systems, rate cards
- **Dev Activity**: GitHub, GitLab, Azure DevOps APIs
- **Ops Activity**: Application logs, telemetry, monitoring systems

---

## 📊 Reporting Cadence

### Real-Time (Stock Ticker)
- Latest profit, margin, time saved
- Updated every 3-30 seconds
- Shows trending direction

### Daily Snapshots
- End-of-day calculations
- Historical series for trends
- Stored in time-series database

### Weekly/Monthly Aggregates
- Portfolio-level rollups
- Period-over-period comparisons
- Executive dashboards

---

## 🔍 Validation & Audit

### Validation Checks:

1. **Revenue ≥ 0** (can't bill negative hours)
2. **Cost ≥ 0** (can't have negative expenses)
3. **Margin ∈ [-∞, 1]** (can be negative profit, but margin capped at 100%)
4. **actual_hours > 0** (projects require time)
5. **baseline_hours > 0** (must have a reference point)

### Audit Trail:

Store raw inputs alongside calculated metrics:
```json
{
  "project_id": "proj-123",
  "date": "2025-10-02",
  "raw_inputs": {
    "billable_hours": 40,
    "billable_rate": 150,
    "actual_hours": 32,
    "cost_rate": 85,
    "fixed_costs": 200,
    "baseline_hours": 50
  },
  "calculated_metrics": {
    "revenue": 6000,
    "cost": 2920,
    "profit": 3080,
    "margin": 0.513,
    "time_saved": 18
  },
  "metadata": {
    "calculated_at": "2025-10-02T18:00:00Z",
    "calculation_version": "v1.0"
  }
}
```

This allows:
- Recalculation if formulas change
- Debugging incorrect values
- Stakeholder verification
- Compliance/audit requirements

---

## 🚀 Implementation Notes

### Backend (FastAPI)

Create a metrics calculation service:

```python
# backend/services/metrics_service.py

from datetime import date
from typing import Dict, List

class MetricsCalculator:
    """Calculate project value metrics using defensible formulas."""
    
    def calculate_daily_metrics(
        self,
        billable_hours: float,
        billable_rate: float,
        actual_hours: float,
        cost_rate: float,
        fixed_costs: float,
        baseline_hours: float
    ) -> Dict[str, float]:
        """Calculate all core metrics for a single day."""
        
        # Revenue
        revenue = billable_hours * billable_rate
        
        # Cost
        cost = (actual_hours * cost_rate) + fixed_costs
        
        # Profit
        profit = revenue - cost
        
        # Margin
        margin = profit / revenue if revenue > 0 else 0.0
        
        # Time Saved
        time_saved = baseline_hours - actual_hours
        
        # Automation Lift
        automation_lift = time_saved / baseline_hours if baseline_hours > 0 else 0.0
        
        return {
            "revenue": revenue,
            "cost": cost,
            "profit": profit,
            "margin": margin,
            "time_saved": time_saved,
            "automation_lift": automation_lift
        }
    
    def calculate_dev_signal(
        self,
        prs: int,
        commits: int,
        lead_time_improvement: float,
        cycle_time_improvement: float,
        weights: Dict[str, float] = None
    ) -> float:
        """Calculate development velocity signal."""
        
        if weights is None:
            weights = {"prs": 3, "commits": 1, "lead_time": 5, "cycle_time": 5}
        
        signal = (
            weights["prs"] * prs +
            weights["commits"] * commits +
            weights["lead_time"] * lead_time_improvement +
            weights["cycle_time"] * cycle_time_improvement
        )
        
        return signal
    
    def to_index_series(
        self,
        values: List[float],
        baseline: float = None
    ) -> List[float]:
        """Normalize a series to index with baseline=100."""
        
        if not values:
            return []
        
        if baseline is None:
            baseline = values[0]
        
        if baseline == 0:
            baseline = 1  # Avoid division by zero
        
        return [(v / baseline) * 100 for v in values]
```

### Frontend (React)

Metrics are calculated on the backend and consumed by frontend components. The frontend displays them using:

- **Ticker Bar**: Latest values with trend indicators
- **KPI Dashboard**: Historical trends and aggregates
- **Project Panels**: Per-project breakdowns

---

## 📝 Change Log

### v1.0 (2025-10-02)
- Initial formulas defined
- Core metrics: Revenue, Cost, Profit, Margin, Time Saved
- Signals: Dev + Ops throughput proxies
- Index series for trend visualization
- Aggregation rules for portfolio view

---

## 📚 References

- **Profit & Margin**: Standard accounting principles
- **Time Saved**: Lean/Six Sigma baseline comparison
- **Dev Signals**: DORA metrics (Lead Time, Cycle Time)
- **Ops Signals**: Application telemetry best practices

---

**Version**: 1.0  
**Last Updated**: 2025-10-02  
**Owner**: Fast Azure Team

