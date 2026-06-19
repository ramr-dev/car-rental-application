"""
DriveLux GPS Simulator
======================
Simulates GPS devices in rental cars by sending fake coordinates to the backend API.
Vehicles appear to drive around major Indian cities on the admin tracking map.

Usage:
  cd /windows/car-rental-hub-main/chatbot
  python gps_simulator.py

Requirements: requests, pymysql (already in chatbot venv)
"""

import random
import time
import math
import requests
import pymysql

# ── Configuration ──────────────────────────────────────────────────────────

API_URL = "http://localhost:3001/api/gps/update"
GPS_API_KEY = "drivelux-gps-secret-2026"
UPDATE_INTERVAL = 5  # seconds between updates

# Database connection (same as backend .env)
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "root",
    "database": "drivelux",
}

# ── Indian city centers for simulation ─────────────────────────────────────

CITIES = [
    {"name": "New Delhi",  "lat": 28.6139, "lng": 77.2090},
    {"name": "Mumbai",     "lat": 19.0760, "lng": 72.8777},
    {"name": "Bangalore",  "lat": 12.9716, "lng": 77.5946},
    {"name": "Hyderabad",  "lat": 17.3850, "lng": 78.4867},
    {"name": "Chennai",    "lat": 13.0827, "lng": 80.2707},
    {"name": "Pune",       "lat": 18.5204, "lng": 73.8567},
    {"name": "Kolkata",    "lat": 22.5726, "lng": 88.3639},
    {"name": "Jaipur",     "lat": 26.9124, "lng": 75.7873},
]


def get_vehicle_ids():
    """Fetch all vehicle IDs from the database."""
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name FROM vehicles ORDER BY id")
            vehicles = cursor.fetchall()
            return vehicles
    finally:
        conn.close()


def simulate_movement(current_lat, current_lng, speed=0.0008):
    """
    Simulate realistic car movement.
    Moves the coordinate slightly in a random direction.
    speed ≈ 0.0008 degrees ≈ ~80 meters per update (realistic for city driving).
    """
    angle = random.uniform(0, 2 * math.pi)
    # Add some variance to speed (slow down / speed up)
    actual_speed = speed * random.uniform(0.3, 1.5)
    new_lat = current_lat + actual_speed * math.sin(angle)
    new_lng = current_lng + actual_speed * math.cos(angle)
    return round(new_lat, 7), round(new_lng, 7)


def send_gps_update(vehicle_id, latitude, longitude):
    """Send GPS coordinates to the backend API."""
    try:
        response = requests.post(
            API_URL,
            json={
                "vehicleId": vehicle_id,
                "latitude": latitude,
                "longitude": longitude,
            },
            headers={"x-gps-api-key": GPS_API_KEY},
            timeout=5,
        )
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Failed to send update for vehicle {vehicle_id}: {e}")
        return False


def main():
    print("=" * 60)
    print("🛰️  DriveLux GPS Simulator")
    print("=" * 60)
    print(f"📡 API URL: {API_URL}")
    print(f"⏱️  Update interval: {UPDATE_INTERVAL}s")
    print()

    # Get vehicles from database
    print("📋 Fetching vehicles from database...")
    vehicles = get_vehicle_ids()

    if not vehicles:
        print("❌ No vehicles found in database! Add some vehicles first.")
        return

    print(f"✅ Found {len(vehicles)} vehicles:")
    for vid, vname in vehicles:
        print(f"   #{vid} — {vname}")
    print()

    # Assign each vehicle to a random city and starting position
    vehicle_positions = {}
    for i, (vid, vname) in enumerate(vehicles):
        city = CITIES[i % len(CITIES)]
        # Offset slightly from city center so vehicles don't stack
        lat = city["lat"] + random.uniform(-0.02, 0.02)
        lng = city["lng"] + random.uniform(-0.02, 0.02)
        vehicle_positions[vid] = {"lat": lat, "lng": lng, "city": city["name"], "name": vname}
        print(f"   🚗 #{vid} ({vname}) → {city['name']} ({lat:.4f}, {lng:.4f})")

    print()
    print("🟢 Starting GPS simulation... (Press Ctrl+C to stop)")
    print("-" * 60)

    update_count = 0
    try:
        while True:
            update_count += 1
            success_count = 0
            print(f"\n📍 Update #{update_count} ({time.strftime('%H:%M:%S')})")

            for vid, pos in vehicle_positions.items():
                # Simulate movement
                new_lat, new_lng = simulate_movement(pos["lat"], pos["lng"])
                pos["lat"] = new_lat
                pos["lng"] = new_lng

                # Send to API
                if send_gps_update(vid, new_lat, new_lng):
                    success_count += 1
                    print(f"   ✅ #{vid} {pos['name']}: ({new_lat:.5f}, {new_lng:.5f})")
                else:
                    print(f"   ❌ #{vid} {pos['name']}: FAILED")

            print(f"   📊 {success_count}/{len(vehicle_positions)} updates sent")
            time.sleep(UPDATE_INTERVAL)

    except KeyboardInterrupt:
        print("\n\n🛑 Simulator stopped by user.")
        print(f"📊 Total updates sent: {update_count * len(vehicle_positions)}")


if __name__ == "__main__":
    main()
