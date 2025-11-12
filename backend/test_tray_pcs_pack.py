"""
Test tray, pcs, and pack conversions specifically
"""
from app.utils.unit_converter import (
    convert_units,
    is_compound_unit,
    get_unit_type,
    format_quantity_with_unit
)

def test_tray_pcs_pack():
    """Test tray, pcs, and pack conversions"""

    print("=" * 80)
    print("TRAY / PCS / PACK CONVERSION TESTS")
    print("=" * 80)

    # Test 1: Check unit types
    print("\n1. UNIT TYPE DETECTION")
    print("-" * 80)
    units = ["tray", "pcs", "pack", "pc", "piece", "pieces"]
    for unit in units:
        unit_type = get_unit_type(unit)
        is_compound = is_compound_unit(unit)
        print(f"{unit:15} -> type: {unit_type:10} | compound: {is_compound}")

    # Test 2: Tray conversions
    print("\n2. TRAY CONVERSIONS (1 tray = 30 pcs)")
    print("-" * 80)
    tests = [
        # (quantity, from_unit, to_unit, expected_result, description)
        (1, "tray", "pcs", 30.0, "1 tray = 30 pieces"),
        (2, "tray", "pcs", 60.0, "2 trays = 60 pieces"),
        (0.5, "tray", "pcs", 15.0, "half tray = 15 pieces"),
        (30, "pcs", "tray", 1.0, "30 pieces = 1 tray"),
        (60, "pcs", "tray", 2.0, "60 pieces = 2 trays"),
        (15, "pcs", "tray", 0.5, "15 pieces = half tray"),
        (90, "pc", "tray", 3.0, "90 pc = 3 trays"),
    ]

    for qty, from_unit, to_unit, expected, desc in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result and abs(result - expected) < 0.01 else "[FAIL]"
        print(f"{status} {desc}")
        print(f"     {qty} {from_unit} -> {to_unit} = {result} (expected: {expected})")

    # Test 3: Pack conversions
    print("\n3. PACK CONVERSIONS (1 pack = 1 pcs by default)")
    print("-" * 80)
    print("Note: 'pack' is 1:1 with pcs for count items")
    tests = [
        (1, "pack", "pcs", 1.0, "1 pack = 1 piece (default)"),
        (5, "pack", "pcs", 5.0, "5 packs = 5 pieces"),
        (10, "pcs", "pack", 10.0, "10 pieces = 10 packs"),
    ]

    for qty, from_unit, to_unit, expected, desc in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result and abs(result - expected) < 0.01 else "[FAIL]"
        print(f"{status} {desc}")
        print(f"     {qty} {from_unit} -> {to_unit} = {result} (expected: {expected})")

    # Test 4: Pack with tray
    print("\n4. PACK <-> TRAY CONVERSIONS")
    print("-" * 80)
    tests = [
        (30, "pack", "tray", 1.0, "30 packs = 1 tray (via pcs)"),
        (1, "tray", "pack", 30.0, "1 tray = 30 packs (via pcs)"),
        (2, "tray", "pack", 60.0, "2 trays = 60 packs"),
    ]

    for qty, from_unit, to_unit, expected, desc in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result and abs(result - expected) < 0.01 else "[FAIL]"
        print(f"{status} {desc}")
        print(f"     {qty} {from_unit} -> {to_unit} = {result} (expected: {expected})")

    # Test 5: Real-world egg scenario
    print("\n5. REAL-WORLD EGG SCENARIO")
    print("-" * 80)
    print("Recipe: Carbonara needs 2 eggs per serving")
    print("Sold: 50 servings")
    print("Inventory: Eggs stored in trays (30 eggs per tray)")
    print()

    servings_sold = 50
    eggs_per_serving = 2
    total_eggs_needed = servings_sold * eggs_per_serving

    print(f"Total eggs needed: {total_eggs_needed} pcs")

    # Convert to trays
    eggs_in_trays = convert_units(total_eggs_needed, "pcs", "tray")
    print(f"Total eggs needed: {eggs_in_trays} trays")

    # Check if we have enough (assume we have 4 trays)
    available_trays = 4
    available_pcs = convert_units(available_trays, "tray", "pcs")

    print(f"\nInventory available: {available_trays} trays = {available_pcs} pcs")

    if available_pcs >= total_eggs_needed:
        print("[OK] SUFFICIENT STOCK")
        leftover = available_pcs - total_eggs_needed
        leftover_trays = convert_units(leftover, "pcs", "tray")
        print(f"     Leftover: {leftover} pcs ({leftover_trays} trays)")
    else:
        shortage = total_eggs_needed - available_pcs
        shortage_trays = convert_units(shortage, "pcs", "tray")
        print(f"[FAIL] INSUFFICIENT - Short by {shortage} pcs ({shortage_trays} trays)")

    # Test 6: Mixed unit variations
    print("\n6. MIXED UNIT VARIATIONS")
    print("-" * 80)
    tests = [
        (1, "tray", "piece", 30.0, "tray to piece"),
        (1, "tray", "pieces", 30.0, "tray to pieces"),
        (1, "tray", "pc", 30.0, "tray to pc"),
        (30, "piece", "tray", 1.0, "piece to tray"),
        (30, "pieces", "tray", 1.0, "pieces to tray"),
        (30, "pc", "tray", 1.0, "pc to tray"),
    ]

    for qty, from_unit, to_unit, expected, desc in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result and abs(result - expected) < 0.01 else "[FAIL]"
        print(f"{status} {desc}: {qty} {from_unit} -> {to_unit} = {result}")

    # Test 7: Invalid conversions
    print("\n7. INVALID CONVERSIONS (should return None)")
    print("-" * 80)
    tests = [
        (1, "tray", "kg", "tray to kg (count to weight)"),
        (1, "pcs", "ml", "pcs to ml (count to volume)"),
        (1, "pack", "L", "pack to L (count to volume)"),
    ]

    for qty, from_unit, to_unit, desc in tests:
        result = convert_units(qty, from_unit, to_unit)
        status = "[OK]" if result is None else "[FAIL]"
        print(f"{status} {desc}: {result}")

    # Test 8: Formatting
    print("\n8. FORMATTING QUANTITIES")
    print("-" * 80)
    values = [
        (2.5, "tray"),
        (60, "pcs"),
        (15.5, "pack"),
        (1, "tray"),
        (30, "pcs"),
    ]
    for qty, unit in values:
        formatted = format_quantity_with_unit(qty, unit)
        print(f"{qty:10} {unit:8} -> {formatted}")

    print("\n" + "=" * 80)
    print("TEST COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    test_tray_pcs_pack()
