# Running Load Insights

Upload your Strava activity history to see how your running load has shifted over time, spot risky spikes before they become injuries, and get a personalized coaching note, all from your real data.

![Landing page](images/TitlePage.png)

## The Problem

Runners increase mileage too quickly all the time and often without realizing it, especially after a break. This is one of the most common causes of running injuries, and it's invisible unless you're tracking it deliberately.

## The Approach: ACWR

This tool is built around **Acute:Chronic Workload Ratio (ACWR)**, a sports-science metric that compares your current week's mileage to a weighted average of your recent history. Recent weeks count more, old weeks fade gradually, and a chronic floor prevents the math from overreacting to low mileage. The ratio matters more than absolute mileage — a spike is relative to what your body has recently been doing.

![ACWR info toggle with definition and Learn more link](images/ACWR.png)

### Risk Bands

| Band | ACWR | What it means |
|------|------|--------------|
| High Risk | ≥ 1.5 | Sharp spike — significant injury risk |
| Moderate Risk | 1.3 – 1.49 | Load rising faster than ideal |
| Optimal | 0.8 – 1.3 | Well-balanced training |
| Reduced Conditioning | < 0.8 | Below baseline — be gradual if ramping up |

Inactive weeks (0 miles) produce no ratio and appear as gaps in the chart — the chronic average decays during breaks so your first week back is assessed relative to your actual recent baseline, not an inflated one.

### Per-Week Insights

Hover over any data point to see the ACWR value, risk band, mileage context, and a concrete coaching note with specific mileage targets:

| Band | Example |
|------|---------|
| Moderate Risk | ![Moderate Risk tooltip](images/ModerateRisk.png) |
| Reduced Conditioning | ![Reduced Conditioning tooltip](images/ReducedConditioning.png) |
| Reduced Conditioning (Floor) | ![Chronic floor in action](images/ReducedConditioningFloor.png) |

## Full Dashboard

The dashboard shows your current risk status, summary stats, an interactive ACWR timeline with labeled thresholds and a shaded Optimal zone, and an LLM-generated coaching note with forward-looking guidance.

![Full dashboard view](images/UserPage.png)

![Coaching note](images/CoachingNote.png)

## How It Works

```
User uploads activities.csv from Strava's free data export (or tries the sample data)
  → Backend parses runs from the export
  → Python computes weekly mileage, fills gaps, calculates ACWR per week
  → Groq LLM generates a coaching note from the pre-computed data
  → React dashboard displays risk summary, timeline chart, and note
```

The LLM never performs any calculation — it only narrates results that were already computed deterministically. This is intentional: ACWR thresholds and mileage numbers need to be guaranteed accurate, not hallucinated.

## Dark Mode & Mobile

Fully responsive and dark-mode compatible out of the box:

<p align="center">
  <img src="images/TitlePagePhone.PNG" width="250" alt="Landing page on iPhone (dark mode)" />
  &nbsp;&nbsp;
  <img src="images/UserPagePhone.PNG" width="250" alt="Dashboard on iPhone (dark mode)" />
  &nbsp;&nbsp;
  <img src="images/CoachingNotePhone.PNG" width="250" alt="Coaching note on iPhone (dark mode)" />
</p>

## Tech Stack

- **Backend:** FastAPI (Python) — CSV parsing, pipeline orchestration
- **Metrics:** Custom Python — weekly aggregation, gap-filling, EWMA-based ACWR with chronic floor
- **LLM:** Groq — coaching note generation from pre-computed metrics
- **Frontend:** React (Vite) + Recharts
- **Deployment:** Vercel Services (frontend + backend in one project, free Hobby plan)

## Running Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api/*` to the backend on port 8000, matching production routing. Alternatively, run both with `vercel dev` from the repo root.

Copy `.env.example` to `.env` and add a free Groq key from [console.groq.com](https://console.groq.com).

## Deployment

One Vercel project deploys both services (see `vercel.json`): the React app serves `/` and FastAPI serves `/api/*` as a serverless function, so there's no always-on server to pay for or put to sleep. Auto-deploys on git push.

Environment variable: `GROQ_API_KEY`.

## A Note on Strava API Access

As of June 2026, Strava requires an active paid subscription for developer API access. The app was originally built on the Strava OAuth API (tagged `strava-oauth-version`) and now uses Strava's free bulk data export instead.

The OAuth flow is still in the code, switched off. To re-enable it, set `STRAVA_ENABLED=true`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `BACKEND_URL=https://<your-domain>/api` and `FRONTEND_URL=https://<your-domain>` on the backend, `VITE_STRAVA_ENABLED=true` on the frontend, and point Strava's Authorization Callback Domain to your Vercel domain.

## Why EWMA Over Rolling Average

The standard way to calculate ACWR uses a simple rolling average: add up the last 4 weeks and divide by 4. The problem is that week 5 data drops from full influence to zero overnight — a "cliff" that doesn't reflect how fitness actually works. Your body doesn't forget a 15-mile week the instant it's 29 days old.

EWMA (Exponentially Weighted Moving Average) fixes this by decaying old weeks gradually:

```
chronic = (this_week × 0.4) + (previous_chronic × 0.6)
```

Each week, 40% of the weight goes to the new data and 60% carries forward from before. A big week from a month ago still contributes about 13% of its original influence (0.6⁴ ≈ 0.13) rather than disappearing entirely. This produces smoother, more realistic baselines — especially for runners with inconsistent schedules.

### Chronic Floor (3.0 miles)

Without a floor, the math breaks for low-volume runners. If someone averages 1 mile/week and then runs 3 miles, a pure ratio gives ACWR = 3.0 (extreme high risk) — but 3 miles isn't dangerous for anyone regardless of history. The chronic floor caps the denominator at 3.0 miles minimum, so the ratio stays grounded in reality when absolute mileage is too low to cause injury.

## Why ACWR Over TSB

TSB (Training Stress Balance) is what TrainingPeaks uses — it relies on power/pace zones and workout-level stress scores that require either a power meter or accurate pace data with a known fitness threshold. For casual runners tracking only distance and time, those inputs don't exist without calibration. ACWR works with raw mileage alone, making it accessible to any runner with a GPS watch or smartphone. The tradeoff is less precision at high performance levels, but for injury-risk detection in recreational runners, the spike-vs-baseline signal is what matters.

## What's Next

- Strava API pagination for runners with 200+ activities
- Persistence layer so users don't re-upload every visit
- Garmin / GPX / FIT file support

---

Built by [Preity Singh](https://www.linkedin.com/in/preity-singh/) · [GitHub](https://github.com/preity-singh)
