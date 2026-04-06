"""
Data generator for the CVector Industrial Dashboard.
Seeds 24 hours of historical data, then continuously inserts
new sensor readings every 30 seconds.
"""

import os
import random
import math
import time
import signal
from datetime import datetime, timedelta, timezone

import psycopg2

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/cvector"
)

FACILITIES = [
    {"name": "Northfield Power Station", "location": "Chicago, IL", "type": "power_station"},
    {"name": "Lakeview Chemical Plant", "location": "Gary, IN", "type": "chemical_plant"},
    {"name": "Riverside Solar Farm", "location": "Phoenix, AZ", "type": "solar_farm"},
]

# asset_type -> which metrics it reports
# volatility: 0.0 = very stable, 1.0 = very volatile
ASSET_METRIC_CONFIG = {
    "turbine": [
        {"metric": "temperature", "unit": "°F", "base": 340, "variance": 30, "volatility": 0.2},
        {"metric": "power_consumption", "unit": "kW", "base": 1200, "variance": 200, "volatility": 0.7},
        {"metric": "output_rate", "unit": "units/hr", "base": 450, "variance": 80, "volatility": 0.6},
    ],
    "boiler": [
        {"metric": "temperature", "unit": "°F", "base": 420, "variance": 40, "volatility": 0.15},
        {"metric": "pressure", "unit": "PSI", "base": 85, "variance": 15, "volatility": 0.3},
        {"metric": "power_consumption", "unit": "kW", "base": 890, "variance": 150, "volatility": 0.6},
    ],
    "reactor": [
        {"metric": "temperature", "unit": "°F", "base": 380, "variance": 25, "volatility": 0.15},
        {"metric": "pressure", "unit": "PSI", "base": 120, "variance": 20, "volatility": 0.25},
        {"metric": "power_consumption", "unit": "kW", "base": 2500, "variance": 400, "volatility": 0.7},
        {"metric": "output_rate", "unit": "units/hr", "base": 300, "variance": 60, "volatility": 0.6},
    ],
    "compressor": [
        {"metric": "pressure", "unit": "PSI", "base": 95, "variance": 10, "volatility": 0.3},
        {"metric": "power_consumption", "unit": "kW", "base": 750, "variance": 100, "volatility": 0.65},
    ],
    "solar_inverter": [
        {"metric": "irradiance", "unit": "W/m²", "base": 800, "variance": 300, "volatility": 0.5},
    ],
}

ASSETS_BY_FACILITY = {
    "Northfield Power Station": [
        {"name": "Turbine A", "type": "turbine"},
        {"name": "Turbine B", "type": "turbine"},
        {"name": "Boiler Unit 1", "type": "boiler"},
        {"name": "Boiler Unit 2", "type": "boiler"},
    ],
    "Lakeview Chemical Plant": [
        {"name": "Reactor Vessel R1", "type": "reactor"},
        {"name": "Reactor Vessel R2", "type": "reactor"},
        {"name": "Compressor C1", "type": "compressor"},
    ],
    "Riverside Solar Farm": [
        {"name": "Inverter Array S1", "type": "solar_inverter"},
    ],
}

HOURS_OF_DATA = 24
INTERVAL_SECONDS = 30


def generate_value(base: float, variance: float, volatility: float, t: int) -> float:
    """Generate a realistic-looking sensor value.

    Low volatility (e.g. temperature): slow drift, minimal noise.
    High volatility (e.g. power): faster oscillation, bigger noise spikes.
    """
    drift = math.sin(t / 120) * variance * 0.2
    fast = math.sin(t / 15) * variance * 0.15 * volatility
    noise = random.gauss(0, variance * volatility * 0.3)
    spike = 0.0
    if volatility > 0.5 and random.random() < 0.02:
        spike = random.choice([-1, 1]) * variance * volatility * 0.8
    return round(base + drift + fast + noise + spike, 2)


def seed_historical(cur):
    """Seed historical data for the past HOURS_OF_DATA hours."""
    cur.execute("TRUNCATE sensor_readings, assets, facilities RESTART IDENTITY CASCADE")

    now = datetime.now(timezone.utc)
    start_time = now - timedelta(hours=HOURS_OF_DATA)
    num_points = int((HOURS_OF_DATA * 3600) / INTERVAL_SECONDS)

    facility_ids = {}
    for f in FACILITIES:
        cur.execute(
            "INSERT INTO facilities (name, location, type) VALUES (%s, %s, %s) RETURNING id",
            (f["name"], f["location"], f["type"]),
        )
        facility_ids[f["name"]] = cur.fetchone()[0]

    asset_rows = []
    for facility_name, assets in ASSETS_BY_FACILITY.items():
        fid = facility_ids[facility_name]
        for a in assets:
            cur.execute(
                "INSERT INTO assets (facility_id, name, type) VALUES (%s, %s, %s) RETURNING id",
                (fid, a["name"], a["type"]),
            )
            asset_rows.append((cur.fetchone()[0], a["type"]))

    readings = []
    for asset_id, asset_type in asset_rows:
        metrics = ASSET_METRIC_CONFIG[asset_type]
        for i in range(num_points):
            ts = start_time + timedelta(seconds=i * INTERVAL_SECONDS)
            for m in metrics:
                value = generate_value(m["base"], m["variance"], m["volatility"], i)
                readings.append((asset_id, m["metric"], value, m["unit"], ts))

    args_str = ",".join(
        cur.mogrify("(%s,%s,%s,%s,%s)", r).decode() for r in readings
    )
    if args_str:
        cur.execute(
            "INSERT INTO sensor_readings (asset_id, metric_name, value, unit, timestamp) VALUES "
            + args_str
        )

    print(f"Seeded {len(FACILITIES)} facilities, {len(asset_rows)} assets, {len(readings)} readings")
    print(f"Time range: {start_time.isoformat()} to {now.isoformat()}")
    return num_points


def insert_live_readings(cur, asset_rows, tick):
    """Insert one batch of readings for all assets at the current time."""
    now = datetime.now(timezone.utc)
    readings = []
    for asset_id, asset_type in asset_rows:
        for m in ASSET_METRIC_CONFIG[asset_type]:
            value = generate_value(m["base"], m["variance"], m["volatility"], tick)
            readings.append((asset_id, m["metric"], value, m["unit"], now))

    args_str = ",".join(
        cur.mogrify("(%s,%s,%s,%s,%s)", r).decode() for r in readings
    )
    cur.execute(
        "INSERT INTO sensor_readings (asset_id, metric_name, value, unit, timestamp) VALUES "
        + args_str
    )
    return len(readings)


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Seeding historical data...")
    tick = seed_historical(cur)
    conn.commit()
    cur.close()
    conn.close()

    # fresh connection with autocommit for live generation
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("SELECT id, type FROM assets ORDER BY id")
    asset_rows = cur.fetchall()

    running = True
    def handle_signal(_sig, _frame):
        nonlocal running
        running = False
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    print(f"Live generator running — inserting readings every 30s for {len(asset_rows)} assets")

    while running:
        time.sleep(INTERVAL_SECONDS)
        tick += 1
        count = insert_live_readings(cur, asset_rows, tick)
        print(f"Inserted {count} readings (tick {tick})", flush=True)

    cur.close()
    conn.close()
    print("Live generator stopped")


if __name__ == "__main__":
    main()
