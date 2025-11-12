"""
Test unit conversion functionality to verify it works correctly
"""
from app.utils.unit_converter import (
    convert_units,
    is_compound_unit,
    convert_compound_to_base,
    get_unit_type,
    format_quantity_with_unit
)

def test_conversions():
    """Test various unit conversions"""

    print("=" * 80)
    print("UNIT CONVERSION TESTS")
    print("=" * 80)

    # Test 1: Basic weight conversions
    print("\n1. BASIC WEIGHT CONVERSIONS")
    print("-" * 80)
    tests = [
        (2.5, "kg", "g", 2500.0),
        (1000, "g", "kg", 1.0),
        (1, "lb", "g", 453.592),
        (16, "oz", "lb", 1.0),
    ]

    for qty, from_unit, to_unit, expected in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result and abs(result - expected) < 0.01 else "[FAIL]"
        print(f"{status} {qty} {from_unit} -> {to_unit} = {result} (expected: {expected})")

    # Test 2: Basic volume conversions
    print("\n2. BASIC VOLUME CONVERSIONS")
    print("-" * 80)
    tests = [
        (1.5, "L", "ml", 1500.0),
        (500, "ml", "L", 0.5),
        (1, "cup", "ml", 236.588),
        (3, "tsp", "tbsp", 1.0),
    ]

    for qty, from_unit, to_unit, expected in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result and abs(result - expected) < 0.01 else "[FAIL]"
        print(f"{status} {qty} {from_unit} -> {to_unit} = {result} (expected: {expected})")

    # Test 3: Compound unit conversions
    print("\n3. COMPOUND UNIT CONVERSIONS")
    print("-" * 80)
    tests = [
        (2, "tray", "pcs", 60.0),  # 2 trays = 60 pieces
        (60, "pcs", "tray", 2.0),   # 60 pieces = 2 trays
        (3, "sack", "kg", 75.0),    # 3 sacks = 75 kg
        (50, "kg", "sack", 2.0),    # 50 kg = 2 sacks
        (2, "case", "pcs", 48.0),   # 2 cases = 48 pieces
        (1, "dozen", "pcs", 12.0),  # 1 dozen = 12 pieces
    ]

    for qty, from_unit, to_unit, expected in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result and abs(result - expected) < 0.01 else "[FAIL]"
        print(f"{status} {qty} {from_unit} -> {to_unit} = {result} (expected: {expected})")

    # Test 4: Compound with base unit conversions
    print("\n4. COMPOUND + BASE UNIT CONVERSIONS")
    print("-" * 80)
    tests = [
        (2, "sack", "g", 50000.0),  # 2 sacks = 50 kg = 50,000 g
        (75000, "g", "sack", 3.0),  # 75,000 g = 75 kg = 3 sacks
        (1, "bottle", "L", 1.0),    # 1 bottle = 1000 ml = 1 L
    ]

    for qty, from_unit, to_unit, expected in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result and abs(result - expected) < 0.01 else "[FAIL]"
        print(f"{status} {qty} {from_unit} -> {to_unit} = {result} (expected: {expected})")

    # Test 5: Incompatible conversions (should return None)
    print("\n5. INCOMPATIBLE CONVERSIONS (should fail)")
    print("-" * 80)
    tests = [
        (1, "kg", "ml"),   # weight to volume - INCOMPATIBLE
        (1, "L", "pcs"),   # volume to count - INCOMPATIBLE
        (1, "tray", "kg"), # count to weight - INCOMPATIBLE
    ]

    for qty, from_unit, to_unit in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result is None else "[FAIL]"
        print(f"{status} {qty} {from_unit} -> {to_unit} = {result} (expected: None)")

    # Test 6: Real-world restaurant scenario
    print("\n6. REAL-WORLD RESTAURANT SCENARIO")
    print("-" * 80)
    print("Recipe: 1 serving needs 50g of rice")
    print("Sold: 100 servings")
    print("Inventory: stored in sacks (25 kg each)")
    print()

    servings_sold = 100
    rice_per_serving = 50  # grams
    total_rice_needed_g = servings_sold * rice_per_serving  # 5000 g

    print(f"Total rice needed: {total_rice_needed_g} g")

    # Convert to kg
    total_rice_needed_kg = convert_units(total_rice_needed_g, "g", "kg")
    print(f"Total rice needed: {total_rice_needed_kg} kg")

    # Convert to sacks
    total_rice_needed_sacks = convert_units(total_rice_needed_kg, "kg", "sack")
    print(f"Total rice needed: {total_rice_needed_sacks} sacks")

    # Check if we have enough (assume we have 0.3 sacks = 7.5 kg)
    available_sacks = 0.3
    available_kg = convert_units(available_sacks, "sack", "kg")
    available_g = convert_units(available_kg, "kg", "g")

    print(f"\nInventory available: {available_sacks} sacks = {available_kg} kg = {available_g} g")

    if available_g >= total_rice_needed_g:
        print("[OK] SUFFICIENT STOCK")
    else:
        shortage = total_rice_needed_g - available_g
        shortage_kg = convert_units(shortage, "g", "kg")
        print(f"[FAIL] INSUFFICIENT - Short by {shortage} g ({shortage_kg} kg)")

    # Test 7: Unit type detection
    print("\n7. UNIT TYPE DETECTION")
    print("-" * 80)
    units = ["kg", "ml", "pcs", "tray", "sack", "bottle", "L", "g"]
    for unit in units:
        unit_type = get_unit_type(unit)
        is_compound = is_compound_unit(unit)
        print(f"{unit:10} -> type: {unit_type:10} | compound: {is_compound}")

    # Test 8: Format with units
    print("\n8. FORMATTING QUANTITIES")
    print("-" * 80)
    values = [
        (2500.0, "g"),
        (1.5, "kg"),
        (60.0, "pcs"),
        (2.0, "tray"),
        (0.333333, "L"),
    ]
    for qty, unit in values:
        formatted = format_quantity_with_unit(qty, unit)
        print(f"{qty:10} {unit:5} -> {formatted}")

    print("\n" + "=" * 80)
    print("TEST COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    test_conversions()
