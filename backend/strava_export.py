"""
Parse activities.csv from Strava's free bulk export
(Settings > My Account > Download or Delete Your Account > Request Archive)
into the same shape the Strava API returns, so metrics.clean_activities works unchanged.

Quirks of the export:
- It has two "Distance" columns. The first is in the athlete's display units (km or mi),
  the second is in meters. We use the second when present.
- "Activity Date" looks like "Sep 2, 2024, 7:00:00 AM" (UTC). The export must be in English.
"""
import csv
import io
import re
from datetime import datetime

DATE_FORMATS = [
    '%b %d, %Y, %I:%M:%S %p',
    '%b %d, %Y %I:%M:%S %p',
    '%Y-%m-%d %H:%M:%S',
]

RUN_TYPES = {'Run', 'Trail Run', 'Virtual Run'}


class ExportParseError(ValueError):
    pass


def _parse_date(value):
    # Newer exports can use a narrow no-break space before AM/PM
    value = re.sub(r'\s+', ' ', value.replace(' ', ' ')).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ExportParseError(f"Unrecognized date '{value}'. Make sure your Strava language is set to English before exporting.")


def _parse_number(value):
    value = (value or '').replace(',', '').strip()
    return float(value) if value else 0.0


def parse_activities_csv(text):
    rows = list(csv.reader(io.StringIO(text.lstrip('﻿'))))
    if not rows:
        raise ExportParseError("The file is empty.")

    header = rows[0]
    required = ['Activity Date', 'Activity Type', 'Distance']
    missing = [col for col in required if col not in header]
    if missing:
        raise ExportParseError("This doesn't look like Strava's activities.csv. Upload the activities.csv file from inside your Strava export zip.")

    date_idx = header.index('Activity Date')
    type_idx = header.index('Activity Type')
    distance_cols = [i for i, col in enumerate(header) if col == 'Distance']
    moving_cols = [i for i, col in enumerate(header) if col == 'Moving Time']
    elapsed_cols = [i for i, col in enumerate(header) if col == 'Elapsed Time']

    # Second Distance column is meters; if only one exists, it's the display-unit (km) column
    if len(distance_cols) > 1:
        distance_idx, distance_scale = distance_cols[1], 1.0
    else:
        distance_idx, distance_scale = distance_cols[0], 1000.0
    time_idx = (moving_cols or elapsed_cols or [None])[0]

    activities = []
    for row in rows[1:]:
        if len(row) <= max(date_idx, type_idx, distance_idx):
            continue
        if row[type_idx].strip() not in RUN_TYPES:
            continue
        activities.append({
            'start_date': _parse_date(row[date_idx]).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'distance': _parse_number(row[distance_idx]) * distance_scale,
            'moving_time': _parse_number(row[time_idx]) if time_idx is not None and time_idx < len(row) else 0.0,
            'type': 'Run',
        })

    if not activities:
        raise ExportParseError("No runs found in this file.")
    return activities
