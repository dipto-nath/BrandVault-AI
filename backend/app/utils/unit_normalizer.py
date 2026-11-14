import re
from typing import Optional, Tuple
from decimal import Decimal

# Unit normalization mappings
UNIT_ALIASES = {
    # Time
    "hr": "hours",
    "hrs": "hours",
    "hour": "hours",
    "hours": "hours",
    "min": "minutes",
    "mins": "minutes",
    "minute": "minutes",
    "minutes": "minutes",
    "sec": "seconds",
    "secs": "seconds",
    "second": "seconds",
    "seconds": "seconds",
    "day": "days",
    "days": "days",
    "week": "weeks",
    "weeks": "weeks",
    "month": "months",
    "months": "months",
    "year": "years",
    "years": "years",
    # Weight
    "g": "grams",
    "gram": "grams",
    "grams": "grams",
    "kg": "kilograms",
    "kilogram": "kilograms",
    "kilograms": "kilograms",
    "lb": "pounds",
    "lbs": "pounds",
    "pound": "pounds",
    "pounds": "pounds",
    "oz": "ounces",
    "ounce": "ounces",
    "ounces": "ounces",
    # Length
    "mm": "millimeters",
    "millimeter": "millimeters",
    "millimeters": "millimeters",
    "cm": "centimeters",
    "centimeter": "centimeters",
    "centimeters": "centimeters",
    "m": "meters",
    "meter": "meters",
    "meters": "meters",
    "in": "inches",
    "inch": "inches",
    "inches": "inches",
    "ft": "feet",
    "foot": "feet",
    "feet": "feet",
    # Data
    "kb": "kilobytes",
    "mb": "megabytes",
    "gb": "gigabytes",
    "tb": "terabytes",
    # Percentage
    "%": "percent",
    "percent": "percent",
    "percentage": "percent",
    # Frequency
    "hz": "hertz",
    "khz": "kilohertz",
    "mhz": "megahertz",
    "ghz": "gigahertz",
    # Voltage/Power
    "v": "volts",
    "volt": "volts",
    "volts": "volts",
    "w": "watts",
    "watt": "watts",
    "watts": "watts",
    "ah": "ampere_hours",
    "mah": "milliampere_hours",
}

# Unit conversion factors (to base unit)
UNIT_CONVERSIONS = {
    "hours": 1,
    "minutes": 1/60,
    "seconds": 1/3600,
    "days": 24,
    "weeks": 24*7,
    "grams": 1,
    "kilograms": 1000,
    "pounds": 453.592,
    "ounces": 28.3495,
    "millimeters": 1,
    "centimeters": 10,
    "meters": 1000,
    "inches": 25.4,
    "feet": 304.8,
    "kilobytes": 1024,
    "megabytes": 1024*1024,
    "gigabytes": 1024*1024*1024,
    "terabytes": 1024*1024*1024*1024,
    "percent": 1,
    "hertz": 1,
    "kilohertz": 1000,
    "megahertz": 1000000,
    "gigahertz": 1000000000,
    "volts": 1,
    "watts": 1,
    "ampere_hours": 1000,
    "milliampere_hours": 1,
}

def normalize_unit(unit: Optional[str]) -> Optional[str]:
    """Normalize unit to standard form."""
    if not unit:
        return None
    unit_lower = unit.lower().strip()
    return UNIT_ALIASES.get(unit_lower, unit_lower)


def normalize_value(value: str, unit: Optional[str]) -> Tuple[Optional[Decimal], Optional[str]]:
    """Extract and normalize numeric value with unit.
    Returns (normalized_value, normalized_unit).
    """
    if not value:
        return None, normalize_unit(unit)

    # Try to extract number
    # Handle ranges like "10-12" or "up to 12"
    numbers = re.findall(r'\d+(?:[.,]\d+)?', value.replace(',', ''))
    if not numbers:
        return None, normalize_unit(unit)

    # Take the first/max number
    try:
        num = Decimal(max(numbers, key=lambda x: Decimal(x)))
    except:
        return None, normalize_unit(unit)

    normalized_unit = normalize_unit(unit)
    return num, normalized_unit


def convert_units(value: Decimal, from_unit: str, to_unit: str) -> Optional[Decimal]:
    """Convert value from one unit to another."""
    from_norm = normalize_unit(from_unit)
    to_norm = normalize_unit(to_unit)
    
    if from_norm == to_norm:
        return value
    
    if from_norm not in UNIT_CONVERSIONS or to_norm not in UNIT_CONVERSIONS:
        return None
    
    # Convert to base then to target
    base_value = value * Decimal(str(UNIT_CONVERSIONS[from_norm]))
    target_value = base_value / Decimal(str(UNIT_CONVERSIONS[to_norm]))
    return target_value


def compare_values(
    value1: Decimal,
    unit1: str,
    value2: Decimal,
    unit2: str,
    qualifier1: Optional[str] = None,
    qualifier2: Optional[str] = None,
) -> Tuple[bool, str]:
    """Compare two values with units and qualifiers.
    Returns (matches, explanation).
    """
    # Normalize units
    norm_unit1 = normalize_unit(unit1)
    norm_unit2 = normalize_unit(unit2)
    
    if norm_unit1 != norm_unit2:
        # Try conversion
        converted = convert_units(value1, norm_unit1, norm_unit2)
        if converted is not None:
            value1 = converted
        else:
            return False, f"Incompatible units: {unit1} vs {unit2}"
    
    # Handle qualifiers
    if qualifier1 == "up to" and qualifier2 != "up to":
        # "up to X" means value <= X
        if value1 <= value2:
            return True, f"{value1} {unit1} is within 'up to {value2} {unit2}'"
        else:
            return False, f"{value1} {unit1} exceeds 'up to {value2} {unit2}'"
    
    if qualifier2 == "up to" and qualifier1 != "up to":
        if value2 <= value1:
            return True, f"{value2} {unit2} is within 'up to {value1} {unit1}'"
        else:
            return False, f"{value2} {unit2} exceeds 'up to {value1} {unit1}'"
    
    if qualifier1 == "minimum" and qualifier2 != "minimum":
        if value1 >= value2:
            return True, f"{value1} {unit1} meets minimum {value2} {unit2}"
        else:
            return False, f"{value1} {unit1} below minimum {value2} {unit2}"
    
    if qualifier2 == "minimum" and qualifier1 != "minimum":
        if value2 >= value1:
            return True, f"{value2} {unit2} meets minimum {value1} {unit1}"
        else:
            return False, f"{value2} {unit2} below minimum {value1} {unit1}"
    
    # Exact match
    if value1 == value2:
        return True, f"Values match: {value1} {unit1}"
    
    return False, f"Values differ: {value1} {unit1} vs {value2} {unit2}"


def extract_qualifier(text: str) -> Optional[str]:
    """Extract qualifier from text (up to, minimum, exactly, approximately)."""
    text_lower = text.lower()
    if "up to" in text_lower or "upto" in text_lower:
        return "up to"
    if "minimum" in text_lower or "at least" in text_lower:
        return "minimum"
    if "exactly" in text_lower or "precisely" in text_lower:
        return "exactly"
    if "approximately" in text_lower or "approx" in text_lower or "about" in text_lower:
        return "approximately"
    return None
