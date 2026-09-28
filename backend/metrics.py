"""
Metrics for computing weekly mileage and ACWR.
"""
import json 
from datetime import datetime, timedelta
from collections import defaultdict

# Clean to include runs and miles to minutes
def clean_activities(raw):
    activities = []
    for a in raw:
        if a['type'] != 'Run':
            continue
        activities.append({
            'date': datetime.strptime(a['start_date'], '%Y-%m-%dT%H:%M:%SZ').date(),
            'miles': round(a['distance'] / 1609.344, 2),
            'minutes': round(a['moving_time'] / 60, 1)
        })
    return sorted(activities, key=lambda x: x['date'])

# Load activities from a JSON file and clean them
def load_activities(file_path):
    with open(file_path, 'r') as f:
        raw = json.load(f)
    return clean_activities(raw)

# Get the start of the week for a given date
def get_week_start(date):
    return date - timedelta(days=date.weekday())

# Compute weekly mileage from a list of activities
def compute_weekly_mileage(activities):
    weekly_mileage = defaultdict(float)
    for a in activities:
        week_start = get_week_start(a['date'])
        weekly_mileage[week_start] += a['miles']
    return {k: round(v,1) for k, v in sorted(weekly_mileage.items())}

# Fill in missing weeks in the weekly mileage dictionary
def fill_missing_weeks(weekly_mileage):
    weeks = sorted(weekly_mileage.keys())
    if not weeks:
        return weekly_mileage
    
    first_week = weeks[0]
    last_week = weeks[-1]

    filled = {}
    current = first_week
    while current <= last_week:
        filled[current] = weekly_mileage.get(current, 0.0)
        current += timedelta(weeks=1)
    
    return filled

CHRONIC_FLOOR = 3.0
ALPHA_CHRONIC = 0.4  # 2 / (4 + 1), ~4-week decay

def compute_acwr(weekly_mileage, activities):
    weeks = sorted(weekly_mileage.keys())
    results = []
    chronic_ewma = CHRONIC_FLOOR

    runs_by_week = defaultdict(list)
    for a in activities:
        week_start = get_week_start(a['date'])
        runs_by_week[week_start].append({'date': a['date'].strftime('%b %d'), 'miles': a['miles']})

    for i, week in enumerate(weeks):
        acute = weekly_mileage[week]

        chronic_ewma = (acute * ALPHA_CHRONIC) + (chronic_ewma * (1 - ALPHA_CHRONIC)) # update chronic ewma
        chronic_ewma = max(chronic_ewma, CHRONIC_FLOOR)

        if i < 3:
            continue

        if acute == 0:
            continue

        acwr = round(acute / chronic_ewma, 2) # compute acwr

        if acwr >= 1.5:
            risk = 'High Risk'
            safe_target = round(chronic_ewma * 1.3, 1)
            note = f"Sharp spike — {acute}mi vs your {round(chronic_ewma, 1)}mi average. Dial back toward {safe_target}mi next week."
        elif acwr >= 1.3:
            risk = 'Moderate Risk'
            note = f"Load creeping up — {acute}mi vs {round(chronic_ewma, 1)}mi average. Hold steady or ease back slightly."
        elif acwr >= 0.8:
            risk = 'Optimal'
            note = "Well-balanced load — keep this consistency going."
        else:
            risk = 'Reduced Conditioning'
            suggested = round(acute * 1.1, 1)
            if chronic_ewma <= CHRONIC_FLOOR + 0.5:
                note = f"Coming back from a break — hold around {acute}mi or slightly more next week."
            else:
                note = f"Below baseline — aim for around {suggested}mi next week rather than jumping back to your old average."

        results.append({
            'week': week.strftime('%Y-%m-%d'),
            'acute_miles': acute,
            'chronic_avg_miles': round(chronic_ewma, 1),
            'acwr': acwr,
            'risk': risk,
            'note': note,
            'runs': runs_by_week.get(week, [])
        })

    return results

def get_summary(acwr_results):
    if not acwr_results:
        return {'error': 'Not enough data to compute ACWR. At least 4 weeks of data is required.'}

    high_risk = [r for r in acwr_results if r['risk'] == 'High Risk']
    moderate_risk = [r for r in acwr_results if r['risk'] == 'Moderate Risk']
    peak = max(acwr_results, key=lambda x: x['acwr'])

    return {
        'total_weeks': len(acwr_results),
        'high_risk_weeks': len(high_risk),
        'moderate_risk_weeks': len(moderate_risk),
        'peak_acwr': peak['acwr'],
        'peak_week': peak['week'],
        'peak_acute_miles': peak['acute_miles'],
        'peak_chronic_avg_miles': peak['chronic_avg_miles'],
        'all_weeks': acwr_results
    }

# ----------------
if __name__ == "__main__":
    activities = load_activities('data/synthetic_activities.json')
    print(f"Loaded {len(activities)} runs\n")

    weekly_mileage = compute_weekly_mileage(activities)
    weekly_mileage = fill_missing_weeks(weekly_mileage)
    print("Weekly Mileage:")
    for week, miles in weekly_mileage.items():
        print(f"  {week}: {miles} miles")

    acwr_results = compute_acwr(weekly_mileage, activities)
    print("\nACWR Results:")
    for r in acwr_results:
        if r['acwr'] is None:
            print(f" {r['week']}: inactive week")
        else:
            print(f" {r['week']}: ACWR={r['acwr']} {r['risk']} (acute={r['acute_miles']}mi, chronic avg={r['chronic_avg_miles']}mi)")

    summary = get_summary(acwr_results)
    print("\nSummary:")
    print(f"  Weeks with ACWR score: {summary['total_weeks']}")
    print(f"  High Risk Weeks: {summary['high_risk_weeks']}")
    print(f"  Moderate Risk Weeks: {summary['moderate_risk_weeks']}")
    print(f"  Peak ACWR: {summary['peak_acwr']} (Week of: {summary['peak_week']})")