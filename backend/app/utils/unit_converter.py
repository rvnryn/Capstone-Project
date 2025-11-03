"""
Unit Conversion Utility for Inventory Management

Handles conversion between different units of measurement for ingredients.
Supports: weight (kg, g, mg, lbs, oz), volume (L, ml, gal, cup, tbsp, tsp), and count (pcs, pieces, units)
"""

from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)


# Conversion factors to base units
# Weight: base unit is grams (g)
WEIGHT_TO_GRAMS = {
    "g": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "kilogram": 1000.0,
    "kilograms": 1000.0,
    "mg": 0.001,
    "milligram": 0.001,
    "milligrams": 0.001,
    "lb": 453.592,
    "lbs": 453.592,
    "pound": 453.592,
    "pounds": 453.592,
    "oz": 28.3495,
    "ounce": 28.3495,
    "ounces": 28.3495,
}

# Volume: base unit is milliliters (ml)
VOLUME_TO_ML = {
    "ml": 1.0,
    "milliliter": 1.0,
    "milliliters": 1.0,
    "l": 1000.0,
    "liter": 1000.0,
    "liters": 1000.0,
    "gal": 3785.41,
    "gallon": 3785.41,
    "gallons": 3785.41,
    "cup": 236.588,
    "cups": 236.588,
    "tbsp": 14.7868,
    "tablespoon": 14.7868,
    "tablespoons": 14.7868,
    "tsp": 4.92892,
    "teaspoon": 4.92892,
    "teaspoons": 4.92892,
    "fl oz": 29.5735,
    "fluid ounce": 29.5735,
    "fluid ounces": 29.5735,
}

# Count: base unit is pieces (pcs)
COUNT_UNITS = {
    "pcs": 1.0,
    "pc": 1.0,
    "piece": 1.0,
    "pieces": 1.0,
    "unit": 1.0,
    "units": 1.0,
    "item": 1.0,
    "items": 1.0,
    "ea": 1.0,
    "each": 1.0,
}


def normalize_unit(unit: str) -> str:
    """
    Normalize unit string to lowercase and remove extra spaces.
    """
    if not unit:
        return ""
    return unit.strip().lower()


def get_unit_type(unit: str) -> Optional[str]:
    """
    Determine the type of unit (weight, volume, or count).

    Args:
        unit: Unit string (e.g., "kg", "ml", "pcs")

    Returns:
        "weight", "volume", "count", or None if unknown
    """
    normalized = normalize_unit(unit)

    if normalized in WEIGHT_TO_GRAMS:
        return "weight"
    elif normalized in VOLUME_TO_ML:
        return "volume"
    elif normalized in COUNT_UNITS:
        return "count"
    else:
        return None


def convert_to_base_unit(quantity: float, unit: str) -> Tuple[float, str]:
    """
    Convert quantity to base unit for its type.

    Args:
        quantity: Amount to convert
        unit: Source unit

    Returns:
        Tuple of (converted_quantity, base_unit)

    Examples:
        convert_to_base_unit(2.5, "kg") -> (2500.0, "g")
        convert_to_base_unit(1.5, "l") -> (1500.0, "ml")
    """
    normalized = normalize_unit(unit)
    unit_type = get_unit_type(normalized)

    if unit_type == "weight":
        base_quantity = quantity * WEIGHT_TO_GRAMS[normalized]
        return (base_quantity, "g")
    elif unit_type == "volume":
        base_quantity = quantity * VOLUME_TO_ML[normalized]
        return (base_quantity, "ml")
    elif unit_type == "count":
        return (quantity, "pcs")
    else:
        # Unknown unit, return as-is
        logger.warning(f"Unknown unit type: {unit}")
        return (quantity, normalized)


def convert_units(quantity: float, from_unit: str, to_unit: str) -> Optional[float]:
    """
    Convert quantity from one unit to another.

    Args:
        quantity: Amount to convert
        from_unit: Source unit
        to_unit: Target unit

    Returns:
        Converted quantity, or None if conversion not possible

    Examples:
        convert_units(2.5, "kg", "g") -> 2500.0
        convert_units(1500, "ml", "l") -> 1.5
        convert_units(1, "kg", "ml") -> None (incompatible types)
    """
    from_normalized = normalize_unit(from_unit)
    to_normalized = normalize_unit(to_unit)

    # If units are the same, no conversion needed
    if from_normalized == to_normalized:
        return quantity

    # Check if units are compatible
    from_type = get_unit_type(from_normalized)
    to_type = get_unit_type(to_normalized)

    if from_type != to_type:
        logger.error(f"Cannot convert between incompatible unit types: {from_unit} ({from_type}) to {to_unit} ({to_type})")
        return None

    if from_type is None:
        logger.error(f"Unknown unit type for conversion: {from_unit} to {to_unit}")
        return None

    # Convert to base unit first, then to target unit
    if from_type == "weight":
        base_quantity = quantity * WEIGHT_TO_GRAMS[from_normalized]
        converted = base_quantity / WEIGHT_TO_GRAMS[to_normalized]
        return converted
    elif from_type == "volume":
        base_quantity = quantity * VOLUME_TO_ML[from_normalized]
        converted = base_quantity / VOLUME_TO_ML[to_normalized]
        return converted
    elif from_type == "count":
        # Count conversions are 1:1
        return quantity

    return None


def can_convert(from_unit: str, to_unit: str) -> bool:
    """
    Check if conversion between two units is possible.

    Args:
        from_unit: Source unit
        to_unit: Target unit

    Returns:
        True if conversion is possible, False otherwise
    """
    from_type = get_unit_type(normalize_unit(from_unit))
    to_type = get_unit_type(normalize_unit(to_unit))

    return from_type is not None and from_type == to_type


def format_quantity_with_unit(quantity: float, unit: str) -> str:
    """
    Format quantity with unit for display.

    Args:
        quantity: Amount
        unit: Unit string

    Returns:
        Formatted string (e.g., "2.5 kg", "500 ml")
    """
    # Round to 2 decimal places for display
    rounded = round(quantity, 2)

    # Remove trailing zeros
    if rounded == int(rounded):
        return f"{int(rounded)} {unit}"
    else:
        return f"{rounded} {unit}"


def get_conversion_info(from_unit: str, to_unit: str) -> dict:
    """
    Get information about unit conversion.

    Args:
        from_unit: Source unit
        to_unit: Target unit

    Returns:
        Dictionary with conversion information
    """
    from_normalized = normalize_unit(from_unit)
    to_normalized = normalize_unit(to_unit)

    from_type = get_unit_type(from_normalized)
    to_type = get_unit_type(to_normalized)

    can_convert_units = from_type is not None and from_type == to_type

    return {
        "from_unit": from_unit,
        "to_unit": to_unit,
        "from_type": from_type,
        "to_type": to_type,
        "can_convert": can_convert_units,
        "same_unit": from_normalized == to_normalized,
    }
