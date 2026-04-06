"""
Manual script to add new facilities, assets, and seed their readings
into an already running system without destroying existing data.

Usage: docker compose exec backend python -m db.modify_db
"""

import os
import math
import random
from datetime import datetime, timedelta, timezone

import psycopg2

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/cvector"
)

NEW_FACILITY = {"name": "Eastside Manufacturing", "location": "Detroit, MI", "type": "manufacturing"}

NEW_ASSETS = [
    {"name": "Press A", "type": "press"},
    {"name": "Conveyor C1", "type": "conveyor"},
]

# metric configs for the new asset types
METRIC_CONFIGS = {
    "press": [
        {"metric": "vibration", "unit": "mm/s", "base": 4.5, "variance": 2, "volatility": 0.5},
        {"metric": "power_consumption", "unit": "kW", "base": 600, "variance": 100, "volatility": 0.7},
    ],
    "conveyor": [
        {"metric": "vibration", "unit": "mm/s", "base": 2.0, "variance": 1, "volatility": 0.3},
        {"metric": "output_rate", "unit": "units/hr", "base": 200, "variance": 40, "volatility": 0.4},
    ],
}

HOURS_OF_DATA = 2
INTERVAL_SECONDS = 30


def generate_value(base, variance, volatility, t):
    drift = math.sin(t / 120) * variance * 0.2
    fast = math.sin(t / 15) * variance * 0.15 * volatility
    noise = random.gauss(0, variance * volatility * 0.3)
    return round(base + drift + fast + noise, 2)


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO facilities (name, location, type) VALUES (%s, %s, %s) RETURNING id",
        (NEW_FACILITY["name"], NEW_FACILITY["location"], NEW_FACILITY["type"]),
    )
    facility_id = cur.fetchone()[0]
    print(f"Added facility: {NEW_FACILITY['name']} (id={facility_id})")

    now = datetime.now(timezone.utc)
    start_time = now - timedelta(hours=HOURS_OF_DATA)
    num_points = int((HOURS_OF_DATA * 3600) / INTERVAL_SECONDS)

    for asset in NEW_ASSETS:
        cur.execute(
            "INSERT INTO assets (facility_id, name, type) VALUES (%s, %s, %s) RETURNING id",
            (facility_id, asset["name"], asset["type"]),
        )
        asset_id = cur.fetchone()[0]
        print(f"  Added asset: {asset['name']} (id={asset_id})")

        metrics = METRIC_CONFIGS[asset["type"]]
        readings = []
        for i in range(num_points):
            ts = start_time + timedelta(seconds=i * INTERVAL_SECONDS)
            for m in metrics:
                value = generate_value(m["base"], m["variance"], m["volatility"], i)
                readings.append((asset_id, m["metric"], value, m["unit"], ts))

        args_str = ",".join(cur.mogrify("(%s,%s,%s,%s,%s)", r).decode() for r in readings)
        cur.execute(
            "INSERT INTO sensor_readings (asset_id, metric_name, value, unit, timestamp) VALUES " + args_str
        )
        print(f"    Seeded {len(readings)} readings (last 2 hours)")

    conn.commit()
    cur.close()
    conn.close()
    print("Done. New data will appear in the dashboard within 60 seconds.")


if __name__ == "__main__":
    main()
