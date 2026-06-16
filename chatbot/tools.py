"""
tools.py — LangChain tools that give the AI agent read-only access to the
DriveLux MySQL database.

Each function decorated with @tool becomes an "action" the agent can choose
to call when it needs real data (booking status, vehicle info, etc.).
The agent decides autonomously when and how to use these tools.
"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional

from langchain_core.tools import tool
from sqlalchemy import text

from db import get_db

logger = logging.getLogger(__name__)


def _serialize(value):
    """Convert non-JSON-serializable types to strings."""
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime):
        return value.strftime("%d %b %Y")
    return value


def _row_to_dict(row) -> dict:
    """Convert a SQLAlchemy Row to a plain dict."""
    return {key: _serialize(value) for key, value in row._mapping.items()}


# ─────────────────────────────────────────────────────────────────────────────
# Tool 1 — Booking lookup by ID
# ─────────────────────────────────────────────────────────────────────────────

@tool
def get_booking_by_id(booking_id: str) -> str:
    """
    Look up a specific booking in the DriveLux database by its booking ID.
    Returns the booking status, car details, dates, location, and pricing.
    Use this when a customer asks about a specific booking reference number.

    Args:
        booking_id: The booking ID string (e.g., 'DRV-001' or any booking ID format)
    """
    query = text("""
        SELECT
            b.id             AS booking_id,
            b.status,
            b.payment_status,
            b.start_date,
            b.end_date,
            b.pickup_location,
            b.dropoff_location,
            b.total_price,
            b.rental_days,
            b.subtotal,
            b.service_fee,
            b.tax_amount,
            b.deposit_amount,
            b.created_at,
            v.name           AS vehicle_name,
            v.brand,
            v.model,
            v.year,
            v.type           AS vehicle_type,
            v.fuel,
            u.name           AS customer_name,
            u.email          AS customer_email
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN users u    ON b.user_id    = u.id
        WHERE b.id = :booking_id
        LIMIT 1
    """)

    try:
        with get_db() as db:
            result = db.execute(query, {"booking_id": booking_id}).fetchone()

        if not result:
            return (
                f"No booking found with ID '{booking_id}'. "
                "Please double-check the booking reference and try again."
            )

        row = _row_to_dict(result)
        return (
            f"📋 **Booking Details**\n"
            f"- **ID**: {row['booking_id']}\n"
            f"- **Status**: {row['status']}\n"
            f"- **Payment**: {row['payment_status'].upper()}\n"
            f"- **Vehicle**: {row['year']} {row['brand']} {row['model']} ({row['vehicle_name']})\n"
            f"- **Type**: {row['vehicle_type']} | Fuel: {row['fuel']}\n"
            f"- **Pickup**: {row['start_date']} — {row['pickup_location']}\n"
            f"- **Drop-off**: {row['end_date']} — {row['dropoff_location']}\n"
            f"- **Duration**: {row['rental_days']} day(s)\n"
            f"- **Total Price**: ${row['total_price']}\n"
            f"- **Booked on**: {row['created_at']}"
        )
    except Exception as e:
        logger.error(f"get_booking_by_id error: {e}")
        return "Sorry, I couldn't retrieve the booking details right now. Please try again shortly."


# ─────────────────────────────────────────────────────────────────────────────
# Tool 2 — All bookings for a user
# ─────────────────────────────────────────────────────────────────────────────

@tool
def get_user_bookings(user_email: str) -> str:
    """
    Retrieve all bookings associated with a customer's email address.
    Returns a summary list of their bookings with status and dates.
    Use this when a customer asks 'show me my bookings' or 'what bookings do I have?'

    Args:
        user_email: The customer's registered email address
    """
    query = text("""
        SELECT
            b.id          AS booking_id,
            b.status,
            b.payment_status,
            b.start_date,
            b.end_date,
            b.total_price,
            b.rental_days,
            v.name        AS vehicle_name,
            v.brand,
            v.model,
            v.year
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN users u    ON b.user_id    = u.id
        WHERE u.email = :email
        ORDER BY b.created_at DESC
        LIMIT 10
    """)

    try:
        with get_db() as db:
            results = db.execute(query, {"email": user_email}).fetchall()

        if not results:
            return (
                f"No bookings found for {user_email}. "
                "If you believe this is an error, please contact support@drivelux.com."
            )

        lines = [f"📋 **Your Bookings** ({len(results)} found)\n"]
        for i, row in enumerate(results, 1):
            r = _row_to_dict(row)
            lines.append(
                f"**{i}. {r['booking_id']}** — {r['year']} {r['brand']} {r['model']}\n"
                f"   Status: `{r['status']}` | Payment: `{r['payment_status']}`\n"
                f"   {r['start_date']} → {r['end_date']} ({r['rental_days']} days) | ${r['total_price']}\n"
            )

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"get_user_bookings error: {e}")
        return "Sorry, I couldn't retrieve your bookings right now. Please try again shortly."


# ─────────────────────────────────────────────────────────────────────────────
# Tool 3 — Vehicle details by ID
# ─────────────────────────────────────────────────────────────────────────────

@tool
def get_vehicle_info(vehicle_id: int) -> str:
    """
    Retrieve detailed information about a specific vehicle by its ID.
    Returns specs, pricing, features, and current availability.
    Use this when a customer asks about a specific car's details or price.

    Args:
        vehicle_id: The numeric vehicle ID (integer)
    """
    query = text("""
        SELECT
            id, name, brand, model, year, type, fuel, transmission,
            seats, price_per_day, rating, review_count, location,
            available, description, mileage, engine, top_speed, acceleration
        FROM vehicles
        WHERE id = :vehicle_id
        LIMIT 1
    """)

    try:
        with get_db() as db:
            result = db.execute(query, {"vehicle_id": vehicle_id}).fetchone()

        if not result:
            return f"No vehicle found with ID {vehicle_id}."

        r = _row_to_dict(result)
        availability = "✅ Available" if r["available"] else "❌ Not Available"

        return (
            f"🚗 **{r['year']} {r['brand']} {r['model']}** ({r['name']})\n"
            f"- **Type**: {r['type']} | **Fuel**: {r['fuel']} | **Transmission**: {r['transmission']}\n"
            f"- **Seats**: {r['seats']} | **Location**: {r['location']}\n"
            f"- **Price**: ${r['price_per_day']}/day\n"
            f"- **Rating**: {'⭐' * round(r['rating'])} {r['rating']}/5 ({r['review_count']} reviews)\n"
            f"- **Engine**: {r['engine']} | **Top Speed**: {r['top_speed']}\n"
            f"- **Mileage**: {r['mileage']} | **0-100**: {r['acceleration']}\n"
            f"- **Availability**: {availability}\n"
            f"- **About**: {r['description'][:200]}..."
        )
    except Exception as e:
        logger.error(f"get_vehicle_info error: {e}")
        return "Sorry, I couldn't retrieve vehicle information right now."


# ─────────────────────────────────────────────────────────────────────────────
# Tool 4 — Available vehicles search
# ─────────────────────────────────────────────────────────────────────────────

@tool
def search_available_vehicles(vehicle_type: str = "", max_price_per_day: float = 0.0) -> str:
    """
    Search for currently available vehicles on DriveLux.
    Optionally filter by vehicle type (SEDAN, SUV, LUXURY, ELECTRIC, CONVERTIBLE, VAN)
    or maximum price per day.
    Use this when a customer asks 'what cars are available?' or 'show me SUVs'.

    Args:
        vehicle_type: Vehicle category filter (SEDAN, SUV, LUXURY, ELECTRIC, CONVERTIBLE, VAN). Use empty string for no filter.
        max_price_per_day: Maximum price per day filter. Use 0.0 or less for no limit.
    """
    conditions = ["available = 1"]
    params: dict = {}

    if vehicle_type and vehicle_type.strip():
        conditions.append("type = :vtype")
        params["vtype"] = vehicle_type.strip().upper()

    if max_price_per_day and max_price_per_day > 0:
        conditions.append("price_per_day <= :max_price")
        params["max_price"] = max_price_per_day

    where_clause = " AND ".join(conditions)

    query = text(f"""
        SELECT id, name, brand, model, year, type, fuel, transmission,
               seats, price_per_day, rating, location
        FROM vehicles
        WHERE {where_clause}
        ORDER BY rating DESC, price_per_day ASC
        LIMIT 8
    """)

    try:
        with get_db() as db:
            results = db.execute(query, params).fetchall()

        if not results:
            filter_desc = []
            if vehicle_type:
                filter_desc.append(f"type={vehicle_type}")
            if max_price_per_day:
                filter_desc.append(f"max ${max_price_per_day}/day")
            return (
                f"No available vehicles found"
                + (f" matching: {', '.join(filter_desc)}" if filter_desc else "")
                + ". Try different filters or check back later."
            )

        lines = [f"🚗 **Available Vehicles** ({len(results)} found)\n"]
        for r_raw in results:
            r = _row_to_dict(r_raw)
            lines.append(
                f"**#{r['id']} — {r['year']} {r['brand']} {r['model']}** ({r['name']})\n"
                f"   {r['type']} | {r['fuel']} | {r['transmission']} | {r['seats']} seats\n"
                f"   📍 {r['location']} | ⭐ {r['rating']}/5 | **${r['price_per_day']}/day**\n"
            )

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"search_available_vehicles error: {e}")
        return "Sorry, I couldn't search vehicles right now. Please try again shortly."


# ─────────────────────────────────────────────────────────────────────────────
# Tool 5 — Price calculator
# ─────────────────────────────────────────────────────────────────────────────

@tool
def calculate_booking_price(vehicle_id: int, rental_days: int) -> str:
    """
    Calculate the estimated total cost for renting a specific vehicle for a given number of days.
    Includes subtotal, service fee (10%), tax (8%), and refundable security deposit (15%).
    Use this when a customer asks 'how much will it cost to rent X for Y days?'

    Args:
        vehicle_id: The numeric vehicle ID
        rental_days: Number of rental days (must be >= 1)
    """
    if rental_days < 1:
        return "Rental duration must be at least 1 day."

    query = text("""
        SELECT id, name, brand, model, year, price_per_day, available
        FROM vehicles WHERE id = :vid LIMIT 1
    """)

    try:
        with get_db() as db:
            result = db.execute(query, {"vid": vehicle_id}).fetchone()

        if not result:
            return f"No vehicle found with ID {vehicle_id}."

        r = _row_to_dict(result)
        if not r["available"]:
            return f"The {r['year']} {r['brand']} {r['model']} is currently not available for booking."

        price_per_day = float(r["price_per_day"])
        subtotal = price_per_day * rental_days
        service_fee = subtotal * 0.10
        tax = subtotal * 0.08
        deposit = subtotal * 0.15
        total = subtotal + service_fee + tax

        return (
            f"💰 **Price Estimate — {r['year']} {r['brand']} {r['model']}**\n"
            f"- Daily Rate: ${price_per_day:.2f}\n"
            f"- Rental Duration: {rental_days} day(s)\n"
            f"---\n"
            f"- Subtotal: ${subtotal:.2f}\n"
            f"- Service Fee (10%): ${service_fee:.2f}\n"
            f"- Tax (8%): ${tax:.2f}\n"
            f"- **Total Charge: ${total:.2f}**\n"
            f"- Security Deposit (refundable): ${deposit:.2f}\n\n"
            f"_Prices are estimates. Final price shown at checkout._"
        )
    except Exception as e:
        logger.error(f"calculate_booking_price error: {e}")
        return "Sorry, I couldn't calculate the price right now."


# ─────────────────────────────────────────────────────────────────────────────
# Tool 6 — Active offers
# ─────────────────────────────────────────────────────────────────────────────

@tool
def get_active_offers(dummy: str = "") -> str:
    """
    Retrieve all currently active discount offers available on DriveLux.
    Use this when a customer asks about deals, discounts, promo codes, or offers.
    """
    query = text("""
        SELECT title, description, discount_percent, min_days, max_days, badge_color
        FROM offers
        WHERE is_active = 1
        ORDER BY discount_percent DESC
    """)

    try:
        with get_db() as db:
            results = db.execute(query).fetchall()

        if not results:
            return "There are no active offers at the moment. Check back soon for deals!"

        lines = ["🎉 **Active DriveLux Offers**\n"]
        for r_raw in results:
            r = _row_to_dict(r_raw)
            days_range = f"{r['min_days']}+"
            if r["max_days"]:
                days_range = f"{r['min_days']}–{r['max_days']}"
            lines.append(
                f"**{r['title']}** — **{r['discount_percent']}% OFF**\n"
                f"   {r['description']}\n"
                f"   📅 Valid for {days_range} day rentals\n"
            )

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"get_active_offers error: {e}")
        return "Sorry, I couldn't fetch current offers. Please check the Offers section on our website."


# ─────────────────────────────────────────────────────────────────────────────
# Export all tools as a list for the agent
# ─────────────────────────────────────────────────────────────────────────────

ALL_TOOLS = [
    get_booking_by_id,
    get_user_bookings,
    get_vehicle_info,
    search_available_vehicles,
    calculate_booking_price,
    get_active_offers,
]
