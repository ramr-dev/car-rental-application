"""
test_tools.py — Phase 2: Test all 6 DriveLux chatbot tools against the live MySQL DB.

Run:
    source venv/bin/activate
    python test_tools.py

Each tool is tested independently so you can see exactly which ones
pass/fail and why — without needing the Gemini API.
"""

import sys
import os

# ── Make sure we can import our modules ──────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from config import settings
from db import check_db_connection, get_db
from sqlalchemy import text

# ── Colours for terminal output ───────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

passed = 0
failed = 0
skipped = 0


def header(title: str):
    print(f"\n{CYAN}{BOLD}{'─'*55}{RESET}")
    print(f"{CYAN}{BOLD}  {title}{RESET}")
    print(f"{CYAN}{BOLD}{'─'*55}{RESET}")


def ok(label: str, detail: str = ""):
    global passed
    passed += 1
    suffix = f"  →  {detail[:80]}" if detail else ""
    print(f"  {GREEN}✅  PASS{RESET}  {label}{suffix}")


def fail(label: str, reason: str = ""):
    global failed
    failed += 1
    print(f"  {RED}❌  FAIL{RESET}  {label}")
    if reason:
        print(f"          {RED}{reason}{RESET}")


def skip(label: str, reason: str = ""):
    global skipped
    skipped += 1
    print(f"  {YELLOW}⏭   SKIP{RESET}  {label}  ({reason})")


def summary():
    total = passed + failed + skipped
    print(f"\n{BOLD}{'═'*55}{RESET}")
    print(f"{BOLD}  Results: {total} tests — "
          f"{GREEN}{passed} passed{RESET}, "
          f"{RED}{failed} failed{RESET}, "
          f"{YELLOW}{skipped} skipped{RESET}")
    print(f"{BOLD}{'═'*55}{RESET}\n")
    return failed == 0


# ─────────────────────────────────────────────────────────────────────────────
# Step 0 — Config check
# ─────────────────────────────────────────────────────────────────────────────
header("STEP 0 — Configuration")

if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
    ok("Gemini API key set", f"{settings.GEMINI_API_KEY[:12]}...")
else:
    fail("Gemini API key", "Not set — update GEMINI_API_KEY in chatbot/.env")

print(f"  {CYAN}ℹ️   Model  :{RESET} {settings.GEMINI_MODEL}")
print(f"  {CYAN}ℹ️   DB URL :{RESET} {settings.DATABASE_URL.split('@')[-1]}")  # hide creds
print(f"  {CYAN}ℹ️   Port   :{RESET} {settings.PORT}")


# ─────────────────────────────────────────────────────────────────────────────
# Step 1 — Database connection
# ─────────────────────────────────────────────────────────────────────────────
header("STEP 1 — Database Connection")

db_ok = check_db_connection()
if db_ok:
    ok("MySQL connection", "SELECT 1 succeeded")
else:
    fail("MySQL connection", "Cannot reach database — is MySQL running?")
    print(f"\n  {YELLOW}⚠️   Remaining tool tests will be skipped (no DB){RESET}")
    summary()
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# Helper — fetch one real row to use as test data
# ─────────────────────────────────────────────────────────────────────────────
header("STEP 2 — Fetching Test Data from DB")

test_booking_id   = None
test_user_email   = None
test_vehicle_id   = None

try:
    with get_db() as db:
        # Grab first booking
        booking_row = db.execute(text(
            "SELECT b.id, u.email FROM bookings b JOIN users u ON b.user_id=u.id LIMIT 1"
        )).fetchone()

        if booking_row:
            test_booking_id = booking_row[0]
            test_user_email = booking_row[1]
            ok("Found test booking",  f"ID={test_booking_id} | user={test_user_email}")
        else:
            skip("Test booking", "No bookings in DB yet")

        # Grab first vehicle
        vehicle_row = db.execute(text(
            "SELECT id, name FROM vehicles LIMIT 1"
        )).fetchone()

        if vehicle_row:
            test_vehicle_id = vehicle_row[0]
            ok("Found test vehicle", f"ID={test_vehicle_id} | name={vehicle_row[1]}")
        else:
            skip("Test vehicle", "No vehicles in DB yet")

except Exception as e:
    fail("Fetching test data", str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Step 3 — Tool tests (call each tool's underlying query directly)
# ─────────────────────────────────────────────────────────────────────────────
header("STEP 3 — Testing All 6 Tools")

# ── Tool 1 — get_booking_by_id ────────────────────────────────────────────────
print(f"\n  {BOLD}Tool 1 — get_booking_by_id{RESET}")
if test_booking_id:
    try:
        from tools import get_booking_by_id
        result = get_booking_by_id.invoke({"booking_id": test_booking_id})
        if "Booking Details" in result or "booking_id" in result.lower():
            ok("get_booking_by_id (real ID)", result[:60])
        else:
            fail("get_booking_by_id (real ID)", result[:80])
    except Exception as e:
        fail("get_booking_by_id", str(e))

    try:
        result = get_booking_by_id.invoke({"booking_id": "NONEXISTENT-999"})
        if "No booking found" in result:
            ok("get_booking_by_id (invalid ID)", "Correctly returned not-found message")
        else:
            fail("get_booking_by_id (invalid ID)", result[:80])
    except Exception as e:
        fail("get_booking_by_id (invalid ID)", str(e))
else:
    skip("get_booking_by_id", "No test booking available")


# ── Tool 2 — get_user_bookings ────────────────────────────────────────────────
print(f"\n  {BOLD}Tool 2 — get_user_bookings{RESET}")
if test_user_email:
    try:
        from tools import get_user_bookings
        result = get_user_bookings.invoke({"user_email": test_user_email})
        if "Bookings" in result or "booking_id" in result.lower():
            ok("get_user_bookings (real email)", result[:60])
        else:
            fail("get_user_bookings (real email)", result[:80])
    except Exception as e:
        fail("get_user_bookings", str(e))

    try:
        result = get_user_bookings.invoke({"user_email": "nobody@fake.com"})
        if "No bookings found" in result:
            ok("get_user_bookings (unknown email)", "Correctly returned not-found message")
        else:
            fail("get_user_bookings (unknown email)", result[:80])
    except Exception as e:
        fail("get_user_bookings (unknown email)", str(e))
else:
    skip("get_user_bookings", "No test user email available")


# ── Tool 3 — get_vehicle_info ─────────────────────────────────────────────────
print(f"\n  {BOLD}Tool 3 — get_vehicle_info{RESET}")
if test_vehicle_id:
    try:
        from tools import get_vehicle_info
        result = get_vehicle_info.invoke({"vehicle_id": test_vehicle_id})
        if "Price" in result or "Type" in result:
            ok("get_vehicle_info (real ID)", result[:60])
        else:
            fail("get_vehicle_info (real ID)", result[:80])
    except Exception as e:
        fail("get_vehicle_info", str(e))

    try:
        result = get_vehicle_info.invoke({"vehicle_id": 99999})
        if "No vehicle found" in result:
            ok("get_vehicle_info (invalid ID)", "Correctly returned not-found message")
        else:
            fail("get_vehicle_info (invalid ID)", result[:80])
    except Exception as e:
        fail("get_vehicle_info (invalid ID)", str(e))
else:
    skip("get_vehicle_info", "No test vehicle available")


# ── Tool 4 — search_available_vehicles ───────────────────────────────────────
print(f"\n  {BOLD}Tool 4 — search_available_vehicles{RESET}")
try:
    from tools import search_available_vehicles
    result = search_available_vehicles.invoke({})
    if "Available Vehicles" in result or "No available" in result:
        ok("search_available_vehicles (no filter)", result[:60])
    else:
        fail("search_available_vehicles (no filter)", result[:80])
except Exception as e:
    fail("search_available_vehicles (no filter)", str(e))

try:
    result = search_available_vehicles.invoke({"vehicle_type": "SUV"})
    if "SUV" in result or "No available" in result:
        ok("search_available_vehicles (SUV filter)", result[:60])
    else:
        fail("search_available_vehicles (SUV filter)", result[:80])
except Exception as e:
    fail("search_available_vehicles (SUV filter)", str(e))

try:
    result = search_available_vehicles.invoke({"max_price_per_day": 100.0})
    if "Available" in result or "No available" in result:
        ok("search_available_vehicles (price filter)", result[:60])
    else:
        fail("search_available_vehicles (price filter)", result[:80])
except Exception as e:
    fail("search_available_vehicles (price filter)", str(e))


# ── Tool 5 — calculate_booking_price ─────────────────────────────────────────
print(f"\n  {BOLD}Tool 5 — calculate_booking_price{RESET}")
if test_vehicle_id:
    try:
        from tools import calculate_booking_price
        result = calculate_booking_price.invoke({"vehicle_id": test_vehicle_id, "rental_days": 3})
        if "Total Charge" in result or "Price Estimate" in result:
            ok("calculate_booking_price (3 days)", result[:60])
        else:
            fail("calculate_booking_price (3 days)", result[:80])
    except Exception as e:
        fail("calculate_booking_price", str(e))

    try:
        result = calculate_booking_price.invoke({"vehicle_id": test_vehicle_id, "rental_days": 0})
        if "at least 1 day" in result:
            ok("calculate_booking_price (0 days guard)", "Correctly rejected 0 days")
        else:
            fail("calculate_booking_price (0 days guard)", result[:80])
    except Exception as e:
        fail("calculate_booking_price (0 days guard)", str(e))
else:
    skip("calculate_booking_price", "No test vehicle available")


# ── Tool 6 — get_active_offers ────────────────────────────────────────────────
print(f"\n  {BOLD}Tool 6 — get_active_offers{RESET}")
try:
    from tools import get_active_offers
    result = get_active_offers.invoke({})
    if "Offers" in result or "no active offers" in result.lower():
        ok("get_active_offers", result[:60])
    else:
        fail("get_active_offers", result[:80])
except Exception as e:
    fail("get_active_offers", str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Step 4 — Memory module
# ─────────────────────────────────────────────────────────────────────────────
header("STEP 4 — Conversation Memory")

try:
    from memory import memory_manager
    session = memory_manager.get_or_create("test-session-abc")
    session.add_user_message("Hello!")
    session.add_ai_message("Hi there!")
    history = session.get_history()

    if len(history) == 2:
        ok("Session create + add messages", "2 messages stored")
    else:
        fail("Session create + add messages", f"Expected 2 messages, got {len(history)}")

    # Test expiry flag (manually set old timestamp)
    import time
    session.last_active = time.time() - 3700  # 1h + 100s ago
    if session.is_expired:
        ok("Session expiry detection", "Expired session correctly flagged")
    else:
        fail("Session expiry detection", "Session should be expired")

    # Cleanup
    memory_manager.delete("test-session-abc")
    if memory_manager.get("test-session-abc") is None:
        ok("Session deletion", "Session removed from store")
    else:
        fail("Session deletion", "Session still exists after delete")

except Exception as e:
    fail("Memory module", str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Final summary
# ─────────────────────────────────────────────────────────────────────────────
header("SUMMARY")
all_passed = summary()

if all_passed:
    print(f"{GREEN}{BOLD}🚀  All tests passed! The chatbot backend is ready.{RESET}")
    print(f"{CYAN}    Start the server with:  python main.py{RESET}\n")
else:
    print(f"{RED}{BOLD}⚠️   Some tests failed. Fix the issues above before starting.{RESET}\n")
    sys.exit(1)
