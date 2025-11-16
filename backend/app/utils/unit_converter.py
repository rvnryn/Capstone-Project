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

# Compound unit conversions (category-specific)
# Format: "unit": {"base_unit": "target_unit", "factor": conversion_factor, "type": "unit_type"}
COMPOUND_UNITS = {
    # Eggs & Dairy
    "tray": {"base_unit": "pcs", "factor": 30.0, "type": "count"},
    "tray_eggs": {"base_unit": "pcs", "factor": 30.0, "type": "count"},
    "dozen": {"base_unit": "pcs", "factor": 12.0, "type": "count"},

    # Beverages - Cans and Cases
    "can": {"base_unit": "pcs", "factor": 1.0, "type": "count"},  # Single can
    "cans": {"base_unit": "pcs", "factor": 1.0, "type": "count"},  # Cans as pieces
    "case": {"base_unit": "pcs", "factor": 24.0, "type": "count"},  # Case of 24 cans/bottles
    "crate": {"base_unit": "pcs", "factor": 24.0, "type": "count"},
    "case_24": {"base_unit": "pcs", "factor": 24.0, "type": "count"},
    "case_12": {"base_unit": "pcs", "factor": 12.0, "type": "count"},  # Case of 12

    # Rice & Grains
    "sack": {"base_unit": "kg", "factor": 25.0, "type": "weight"},
    "sack_rice": {"base_unit": "kg", "factor": 25.0, "type": "weight"},
    "bag": {"base_unit": "kg", "factor": 25.0, "type": "weight"},

    # Generic packs (default conversions - can be customized per item)
    "pack": {"base_unit": "pcs", "factor": 1.0, "type": "count"},  # Default 1:1 for count items
    "packs": {"base_unit": "pcs", "factor": 1.0, "type": "count"},
    "pack_meat": {"base_unit": "g", "factor": 500.0, "type": "weight"},  # 500g packs
    "pack_condiment": {"base_unit": "ml", "factor": 250.0, "type": "volume"},  # 250ml packs

    # Bottles
    "bottle": {"base_unit": "ml", "factor": 1000.0, "type": "volume"},  # 1L bottles
    "bottle_750": {"base_unit": "ml", "factor": 750.0, "type": "volume"},
    "bottles": {"base_unit": "ml", "factor": 1000.0, "type": "volume"},
}


def normalize_unit(unit: str) -> str:
    """
    Normalize unit string to lowercase and remove extra spaces.
    """
    if not unit:
        return ""
    return unit.strip().lower()


def is_compound_unit(unit: str) -> bool:
    """
    Check if a unit is a compound unit (tray, pack, sack, etc.).

    Args:
        unit: Unit string

    Returns:
        True if unit is compound, False otherwise
    """
    normalized = normalize_unit(unit)
    return normalized in COMPOUND_UNITS


def convert_compound_to_base(quantity: float, compound_unit: str) -> Tuple[float, str]:
    """
    Convert compound unit to its base unit.

    Args:
        quantity: Amount in compound unit
        compound_unit: Compound unit (e.g., "tray", "sack", "case")

    Returns:
        Tuple of (converted_quantity, base_unit)

    Examples:
        convert_compound_to_base(2, "tray") -> (60.0, "pcs")
        convert_compound_to_base(3, "sack") -> (75.0, "kg")
    """
    normalized = normalize_unit(compound_unit)

    if normalized in COMPOUND_UNITS:
        compound_info = COMPOUND_UNITS[normalized]
        converted_qty = quantity * compound_info["factor"]
        base_unit = compound_info["base_unit"]
        logger.info(f"Converted {quantity} {compound_unit} to {converted_qty} {base_unit}")
        return (converted_qty, base_unit)
    else:
        logger.warning(f"Unit '{compound_unit}' is not a recognized compound unit")
        return (quantity, normalized)


def get_unit_type(unit: str) -> Optional[str]:
    """
    Determine the type of unit (weight, volume, count, or compound).

    Args:
        unit: Unit string (e.g., "kg", "ml", "pcs", "tray")

    Returns:
        "weight", "volume", "count", "compound", or None if unknown
    """
    normalized = normalize_unit(unit)

    # Check compound units first
    if normalized in COMPOUND_UNITS:
        return "compound"
    elif normalized in WEIGHT_TO_GRAMS:
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
    Now supports compound units (tray, pack, sack, case, etc.).

    Args:
        quantity: Amount to convert
        from_unit: Source unit (can be compound)
        to_unit: Target unit (can be compound)

    Returns:
        Converted quantity, or None if conversion not possible

    Examples:
        convert_units(2.5, "kg", "g") -> 2500.0
        convert_units(1500, "ml", "l") -> 1.5
        convert_units(2, "tray", "pcs") -> 60.0
        convert_units(3, "sack", "kg") -> 75.0
        convert_units(1, "kg", "ml") -> None (incompatible types)
    """
    from_normalized = normalize_unit(from_unit)
    to_normalized = normalize_unit(to_unit)

    # If units are the same, no conversion needed
    if from_normalized == to_normalized:
        return quantity

    # STEP 1: Convert compound units to their base units
    working_quantity = quantity
    working_from_unit = from_normalized

    # If source is compound, convert to base first
    if is_compound_unit(from_normalized):
        working_quantity, working_from_unit = convert_compound_to_base(quantity, from_normalized)
        working_from_unit = normalize_unit(working_from_unit)

    # If target is compound, we need to convert to its base unit first
    working_to_unit = to_normalized
    if is_compound_unit(to_normalized):
        # Get the base unit of the target compound unit
        compound_info = COMPOUND_UNITS[to_normalized]
        working_to_unit = normalize_unit(compound_info["base_unit"])

    # STEP 2: Check compatibility of the working units
    from_type = get_unit_type(working_from_unit)
    to_type = get_unit_type(working_to_unit)

    # Handle compound types by checking their base types
    if from_type == "compound":
        from_type = COMPOUND_UNITS[working_from_unit]["type"]
    if to_type == "compound":
        to_type = COMPOUND_UNITS[working_to_unit]["type"]

    if from_type != to_type:
        logger.error(f"Cannot convert between incompatible unit types: {from_unit} ({from_type}) to {to_unit} ({to_type})")
        return None

    if from_type is None:
        logger.error(f"Unknown unit type for conversion: {from_unit} to {to_unit}")
        return None

    # STEP 3: Convert between base units
    converted_quantity = None

    if from_type == "weight":
        base_quantity = working_quantity * WEIGHT_TO_GRAMS[working_from_unit]
        converted_quantity = base_quantity / WEIGHT_TO_GRAMS[working_to_unit]
    elif from_type == "volume":
        base_quantity = working_quantity * VOLUME_TO_ML[working_from_unit]
        converted_quantity = base_quantity / VOLUME_TO_ML[working_to_unit]
    elif from_type == "count":
        # Count conversions are 1:1 at base level
        converted_quantity = working_quantity

    # STEP 4: If target was compound, convert from base to compound
    if is_compound_unit(to_normalized) and converted_quantity is not None:
        compound_info = COMPOUND_UNITS[to_normalized]
        converted_quantity = converted_quantity / compound_info["factor"]

    return converted_quantity


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
