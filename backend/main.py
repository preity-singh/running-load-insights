from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import json
import os
from dotenv import load_dotenv

from strava import get_authorization_url, exchange_code_for_token, get_activities
from strava_export import parse_activities_csv, ExportParseError
from metrics import clean_activities, compute_weekly_mileage, fill_missing_weeks, compute_acwr, get_summary
from llm import get_coaching_note

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
# Strava API access now requires a paid subscription; set to "true" to re-enable the OAuth flow
STRAVA_ENABLED = os.getenv("STRAVA_ENABLED", "false").lower() == "true"
DEMO_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "synthetic_activities.json")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)


def analyze(activities_raw):
    activities = clean_activities(activities_raw)

    weekly = compute_weekly_mileage(activities)
    weekly = fill_missing_weeks(weekly)
    acwr_results = compute_acwr(weekly, activities)
    summary = get_summary(acwr_results)

    if 'error' in summary:
        return {"error": summary['error']}

    coaching_note = get_coaching_note(summary)

    recent = acwr_results[-3:]
    risk_priority = ['High Risk', 'Moderate Risk', 'Reduced Conditioning', 'Optimal']
    worst_risk = next((r for r in risk_priority if any(w['risk'] == r for w in recent)), 'Optimal')
    risk_level_map = {
        'High Risk': 'high',
        'Moderate Risk': 'moderate',
        'Optimal': 'optimal',
        'Reduced Conditioning': 'reduced_conditioning',
    }
    risk_level = risk_level_map[worst_risk]

    return {
        "risk_level": risk_level,
        "peak_acwr": summary['peak_acwr'],
        "peak_week": summary['peak_week'],
        "high_risk_weeks": summary['high_risk_weeks'],
        "moderate_risk_weeks": summary['moderate_risk_weeks'],
        "total_weeks": summary['total_weeks'],
        "timeline": summary['all_weeks'],
        "coaching_note": coaching_note
    }


@app.post("/analyze")
async def analyze_export(request: Request):
    try:
        text = (await request.body()).decode('utf-8-sig')
        return analyze(parse_activities_csv(text))
    except ExportParseError as e:
        return {"error": str(e)}
    except UnicodeDecodeError:
        return {"error": "Couldn't read that file. Upload the activities.csv file from your Strava export."}
    except Exception as e:
        return {"error": f"Failed to process your data: {str(e)}"}


@app.get("/demo")
def demo():
    with open(DEMO_DATA_PATH, 'r') as f:
        return analyze(json.load(f))


# ---- Strava OAuth flow (disabled unless STRAVA_ENABLED=true) ----

@app.get("/login")
def login():
    if not STRAVA_ENABLED:
        return {"error": "Strava connect is disabled."}
    redirect_uri = f"{BACKEND_URL}/callback"
    auth_url = get_authorization_url(redirect_uri)
    return {"auth_url": auth_url}


@app.get("/callback")
def callback(code: str):
    return RedirectResponse(url=f"{FRONTEND_URL}?code={code}")


@app.get("/process")
def process(code: str):
    if not STRAVA_ENABLED:
        return {"error": "Strava connect is disabled."}
    try:
        token_data = exchange_code_for_token(code)
        if 'access_token' not in token_data:
            return {"error": "Authorization failed or code already used. Please reconnect."}
        return analyze(get_activities(token_data['access_token']))
    except Exception as e:
        return {"error": f"Failed to process your data: {str(e)}"}
