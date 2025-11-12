export const INVENTORY_UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "lbs", label: "lbs" },
  { value: "oz", label: "oz" },
  { value: "L", label: "L" },
  { value: "ml", label: "mL" },
  { value: "gal", label: "gallon" },
  { value: "pcs", label: "pcs" },
  { value: "pack", label: "pack" },
  { value: "case", label: "case" },
  { value: "sack", label: "sack" },
  { value: "btl", label: "bottle" },
  { value: "can", label: "can" },
  { value: "tray", label: "tray" },
];

export const INGREDIENT_UNIT_OPTIONS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
  { value: "pcs", label: "pcs" },
  { value: "pack", label: "pack" },
  { value: "tbsp", label: "tbsp" },
  { value: "tsp", label: "tsp" },
  { value: "cup", label: "cup" },
  { value: "oz", label: "oz" },
];

// Category-specific unit mapping
export const CATEGORY_UNIT_MAPPING: Record<string, string[]> = {
  Meats: ["kg", "g", "pcs", "pack"],
  Seafood: ["pack"],
  "Vegetables & Fruits": ["kg", "g", "pcs", "can", "pack"],
  "Dairy & Eggs": ["pcs", "tray"],
  "Seasonings & Condiments": ["kg", "g", "ml", "L", "gal", "pack"],
  "Rice & Noodles": ["kg", "g", "sack", "pack"],
  "Cooking Oils": ["L", "ml", "gal"],
  Beverage: ["can", "case", "gal"],
};

// Helper function to get units for a specific category
export const getUnitsForCategory = (category: string) => {
  const allowedUnits = CATEGORY_UNIT_MAPPING[category];

  // If category not found or no mapping exists, return all units
  if (!allowedUnits || allowedUnits.length === 0) {
    return INVENTORY_UNIT_OPTIONS;
  }

  // Filter units based on category mapping
  return INVENTORY_UNIT_OPTIONS.filter((option) =>
    allowedUnits.includes(option.value)
  );
};
