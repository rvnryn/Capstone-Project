/**
 * Frontend Validation Utilities
 * Matches backend Pydantic validation rules for comprehensive validation
 */

// ===========================
// CONSTANTS & ENUMS
// ===========================

export const CATEGORIES = [
  "Meats",
  "Seafood",
  "Vegetables & Fruits",
  "Dairy & Eggs",
  "Seasonings & Condiments",
  "Rice & Noodles",
  "Cooking Oils",
  "Beverage",
] as const;

export const STOCK_STATUSES = [
  "Normal",
  "Low",
  "Critical",
  "Out Of Stock",
  "High",
] as const;

export const USER_ROLES = [
  "Owner",
  "General Manager",
  "Store Manager",
  "Staff",
] as const;

export const USER_STATUSES = ["active", "inactive"] as const;

export type Category = (typeof CATEGORIES)[number];
export type StockStatus = (typeof STOCK_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

// ===========================
// VALIDATION LIMITS
// ===========================

export const VALIDATION_LIMITS = {
  // Inventory
  ITEM_NAME_MIN: 2,
  ITEM_NAME_MAX: 100,
  STOCK_QUANTITY_MIN: 0,
  STOCK_QUANTITY_MAX: 1000000,
  UNIT_COST_MIN: 0,
  UNIT_COST_MAX: 1000000,
  TRANSFER_QUANTITY_MIN: 0.01,
  SPOILAGE_REASON_MAX: 500,

  // Users
  USER_NAME_MIN: 2,
  USER_NAME_MAX: 100,
  USERNAME_MIN: 3,
  USERNAME_MAX: 50,
  EMAIL_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,
  LOGIN_PASSWORD_MIN: 6,
  AUTH_ID_MIN: 10,
  AUTH_ID_MAX: 100,

  // Settings
  DEFAULT_UNIT_MAX: 20,
  LOW_STOCK_THRESHOLD_MIN: 0,
  LOW_STOCK_THRESHOLD_MAX: 100000,
} as const;

// ===========================
// REGEX PATTERNS
// ===========================

export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  USER_NAME: /^[a-zA-Z\s'-]+$/,
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /[0-9]/,
} as const;

// ===========================
// VALIDATION ERROR MESSAGES
// ===========================

export const ERROR_MESSAGES = {
  // Common
  REQUIRED: "This field is required",
  INVALID_FORMAT: "Invalid format",

  // Item Name
  ITEM_NAME_REQUIRED: "Item name is required",
  ITEM_NAME_MIN: `Item name must be at least ${VALIDATION_LIMITS.ITEM_NAME_MIN} characters`,
  ITEM_NAME_MAX: `Item name cannot exceed ${VALIDATION_LIMITS.ITEM_NAME_MAX} characters`,
  ITEM_NAME_WHITESPACE: "Item name cannot be only whitespace",

  // Stock Quantity
  STOCK_QUANTITY_REQUIRED: "Stock quantity is required",
  STOCK_QUANTITY_NEGATIVE: "Stock quantity cannot be negative",
  STOCK_QUANTITY_MAX: `Stock quantity exceeds maximum allowed (${VALIDATION_LIMITS.STOCK_QUANTITY_MAX.toLocaleString()})`,

  // Unit Cost
  UNIT_COST_NEGATIVE: "Unit cost cannot be negative",
  UNIT_COST_MAX: `Unit cost exceeds maximum allowed (₱${VALIDATION_LIMITS.UNIT_COST_MAX.toLocaleString()})`,

  // Transfer Quantity
  TRANSFER_QUANTITY_REQUIRED: "Transfer quantity is required",
  TRANSFER_QUANTITY_POSITIVE: "Transfer quantity must be greater than 0",
  TRANSFER_QUANTITY_MAX: `Transfer quantity exceeds maximum allowed (${VALIDATION_LIMITS.STOCK_QUANTITY_MAX.toLocaleString()})`,

  // Dates
  EXPIRATION_PAST: "Expiration date cannot be in the past",
  EXPIRATION_BEFORE_BATCH: "Expiration date must be after batch date",
  BATCH_FUTURE: "Batch date cannot be in the future",

  // Category & Status
  CATEGORY_REQUIRED: "Category is required",
  CATEGORY_INVALID: "Invalid category selected",
  STATUS_INVALID: "Invalid status selected",

  // Spoilage
  SPOILAGE_REASON_MAX: `Reason cannot exceed ${VALIDATION_LIMITS.SPOILAGE_REASON_MAX} characters`,

  // User Name
  USER_NAME_REQUIRED: "Name is required",
  USER_NAME_MIN: `Name must be at least ${VALIDATION_LIMITS.USER_NAME_MIN} characters`,
  USER_NAME_MAX: `Name cannot exceed ${VALIDATION_LIMITS.USER_NAME_MAX} characters`,
  USER_NAME_INVALID: "Name can only contain letters, spaces, hyphens, and apostrophes",
  USER_NAME_WHITESPACE: "Name cannot be only whitespace",

  // Username
  USERNAME_REQUIRED: "Username is required",
  USERNAME_MIN: `Username must be at least ${VALIDATION_LIMITS.USERNAME_MIN} characters`,
  USERNAME_MAX: `Username cannot exceed ${VALIDATION_LIMITS.USERNAME_MAX} characters`,
  USERNAME_INVALID: "Username can only contain letters, numbers, underscores, and hyphens",

  // Email
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Invalid email format",
  EMAIL_MAX: `Email cannot exceed ${VALIDATION_LIMITS.EMAIL_MAX} characters`,

  // Password
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MIN: `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters`,
  PASSWORD_MAX: `Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX} characters`,
  PASSWORD_UPPERCASE: "Password must contain at least one uppercase letter",
  PASSWORD_LOWERCASE: "Password must contain at least one lowercase letter",
  PASSWORD_NUMBER: "Password must contain at least one number",
  PASSWORD_STRENGTH: "Password must contain uppercase, lowercase, and number",

  // Role & User Status
  ROLE_REQUIRED: "Role is required",
  ROLE_INVALID: "Invalid role selected",
  USER_STATUS_INVALID: "Invalid status selected",

  // Settings
  SETTING_NAME_REQUIRED: "Ingredient name is required",
  DEFAULT_UNIT_MAX: `Default unit cannot exceed ${VALIDATION_LIMITS.DEFAULT_UNIT_MAX} characters`,
  LOW_STOCK_THRESHOLD_NEGATIVE: "Low stock threshold cannot be negative",
  LOW_STOCK_THRESHOLD_MAX: `Low stock threshold exceeds maximum (${VALIDATION_LIMITS.LOW_STOCK_THRESHOLD_MAX.toLocaleString()})`,
} as const;

// ===========================
// VALIDATION FUNCTIONS
// ===========================

/**
 * Validate item name (inventory items, menu items)
 */
export const validateItemName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return ERROR_MESSAGES.ITEM_NAME_WHITESPACE;
  }

  const trimmed = name.trim();
  if (trimmed.length < VALIDATION_LIMITS.ITEM_NAME_MIN) {
    return ERROR_MESSAGES.ITEM_NAME_MIN;
  }
  if (trimmed.length > VALIDATION_LIMITS.ITEM_NAME_MAX) {
    return ERROR_MESSAGES.ITEM_NAME_MAX;
  }

  return null;
};

/**
 * Validate stock quantity
 */
export const validateStockQuantity = (quantity: number | string): string | null => {
  const num = typeof quantity === "string" ? parseFloat(quantity) : quantity;

  if (isNaN(num)) {
    return ERROR_MESSAGES.STOCK_QUANTITY_REQUIRED;
  }
  if (num < VALIDATION_LIMITS.STOCK_QUANTITY_MIN) {
    return ERROR_MESSAGES.STOCK_QUANTITY_NEGATIVE;
  }
  if (num > VALIDATION_LIMITS.STOCK_QUANTITY_MAX) {
    return ERROR_MESSAGES.STOCK_QUANTITY_MAX;
  }

  return null;
};

/**
 * Validate unit cost
 */
export const validateUnitCost = (cost: number | string | null): string | null => {
  if (cost === null || cost === "") {
    return null; // Optional field
  }

  const num = typeof cost === "string" ? parseFloat(cost) : cost;

  if (isNaN(num)) {
    return null; // Optional field
  }
  if (num < VALIDATION_LIMITS.UNIT_COST_MIN) {
    return ERROR_MESSAGES.UNIT_COST_NEGATIVE;
  }
  if (num > VALIDATION_LIMITS.UNIT_COST_MAX) {
    return ERROR_MESSAGES.UNIT_COST_MAX;
  }

  return null;
};

/**
 * Validate transfer quantity (must be positive)
 */
export const validateTransferQuantity = (quantity: number | string): string | null => {
  const num = typeof quantity === "string" ? parseFloat(quantity) : quantity;

  if (isNaN(num) || num <= 0) {
    return ERROR_MESSAGES.TRANSFER_QUANTITY_POSITIVE;
  }
  if (num > VALIDATION_LIMITS.STOCK_QUANTITY_MAX) {
    return ERROR_MESSAGES.TRANSFER_QUANTITY_MAX;
  }

  return null;
};

/**
 * Validate category
 */
export const validateCategory = (category: string): string | null => {
  if (!category || category.trim().length === 0) {
    return ERROR_MESSAGES.CATEGORY_REQUIRED;
  }
  if (!CATEGORIES.includes(category as Category)) {
    return ERROR_MESSAGES.CATEGORY_INVALID;
  }

  return null;
};

/**
 * Validate stock status
 */
export const validateStockStatus = (status: string): string | null => {
  if (!status || status.trim().length === 0) {
    return null; // Optional field with default
  }
  if (!STOCK_STATUSES.includes(status as StockStatus)) {
    return ERROR_MESSAGES.STATUS_INVALID;
  }

  return null;
};

/**
 * Validate expiration date
 */
export const validateExpirationDate = (
  expirationDate: string | null,
  batchDate?: string | null
): string | null => {
  if (!expirationDate) {
    return null; // Optional field
  }

  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for date-only comparison

  if (expDate < today) {
    return ERROR_MESSAGES.EXPIRATION_PAST;
  }

  if (batchDate) {
    const bDate = new Date(batchDate);
    if (expDate < bDate) {
      return ERROR_MESSAGES.EXPIRATION_BEFORE_BATCH;
    }
  }

  return null;
};

/**
 * Validate batch date
 */
export const validateBatchDate = (batchDate: string | null): string | null => {
  if (!batchDate) {
    return null; // Optional field
  }

  const batch = new Date(batchDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  if (batch > today) {
    return ERROR_MESSAGES.BATCH_FUTURE;
  }

  return null;
};

/**
 * Validate spoilage reason
 */
export const validateSpoilageReason = (reason: string | null): string | null => {
  if (!reason || reason.trim().length === 0) {
    return null; // Optional field
  }

  if (reason.trim().length > VALIDATION_LIMITS.SPOILAGE_REASON_MAX) {
    return ERROR_MESSAGES.SPOILAGE_REASON_MAX;
  }

  return null;
};

/**
 * Validate user name (full name)
 */
export const validateUserName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return ERROR_MESSAGES.USER_NAME_WHITESPACE;
  }

  const trimmed = name.trim();
  if (trimmed.length < VALIDATION_LIMITS.USER_NAME_MIN) {
    return ERROR_MESSAGES.USER_NAME_MIN;
  }
  if (trimmed.length > VALIDATION_LIMITS.USER_NAME_MAX) {
    return ERROR_MESSAGES.USER_NAME_MAX;
  }
  if (!REGEX_PATTERNS.USER_NAME.test(trimmed)) {
    return ERROR_MESSAGES.USER_NAME_INVALID;
  }

  return null;
};

/**
 * Validate username
 */
export const validateUsername = (username: string): string | null => {
  if (!username || username.trim().length === 0) {
    return ERROR_MESSAGES.USERNAME_REQUIRED;
  }

  const trimmed = username.trim();
  if (trimmed.length < VALIDATION_LIMITS.USERNAME_MIN) {
    return ERROR_MESSAGES.USERNAME_MIN;
  }
  if (trimmed.length > VALIDATION_LIMITS.USERNAME_MAX) {
    return ERROR_MESSAGES.USERNAME_MAX;
  }
  if (!REGEX_PATTERNS.USERNAME.test(trimmed)) {
    return ERROR_MESSAGES.USERNAME_INVALID;
  }

  return null;
};

/**
 * Validate email
 */
export const validateEmail = (email: string): string | null => {
  if (!email || email.trim().length === 0) {
    return ERROR_MESSAGES.EMAIL_REQUIRED;
  }

  const trimmed = email.trim();
  if (trimmed.length > VALIDATION_LIMITS.EMAIL_MAX) {
    return ERROR_MESSAGES.EMAIL_MAX;
  }
  if (!REGEX_PATTERNS.EMAIL.test(trimmed)) {
    return ERROR_MESSAGES.EMAIL_INVALID;
  }

  return null;
};

/**
 * Validate email or username (for login)
 */
export const validateEmailOrUsername = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return "Email/username is required";
  }

  const trimmed = value.trim();

  // If contains @, validate as email
  if (trimmed.includes("@")) {
    if (!REGEX_PATTERNS.EMAIL.test(trimmed)) {
      return ERROR_MESSAGES.EMAIL_INVALID;
    }
  } else {
    // Validate as username
    if (!REGEX_PATTERNS.USERNAME.test(trimmed)) {
      return ERROR_MESSAGES.USERNAME_INVALID;
    }
    if (trimmed.length < VALIDATION_LIMITS.USERNAME_MIN) {
      return ERROR_MESSAGES.USERNAME_MIN;
    }
  }

  return null;
};

/**
 * Validate password (with strength requirements)
 */
export const validatePassword = (
  password: string,
  requireStrength: boolean = true
): string | null => {
  if (!password || password.trim().length === 0) {
    return ERROR_MESSAGES.PASSWORD_REQUIRED;
  }

  const minLength = requireStrength
    ? VALIDATION_LIMITS.PASSWORD_MIN
    : VALIDATION_LIMITS.LOGIN_PASSWORD_MIN;

  if (password.length < minLength) {
    return requireStrength
      ? ERROR_MESSAGES.PASSWORD_MIN
      : `Password must be at least ${minLength} characters`;
  }
  if (password.length > VALIDATION_LIMITS.PASSWORD_MAX) {
    return ERROR_MESSAGES.PASSWORD_MAX;
  }

  // Only check strength for user creation/update
  if (requireStrength) {
    if (!REGEX_PATTERNS.UPPERCASE.test(password)) {
      return ERROR_MESSAGES.PASSWORD_UPPERCASE;
    }
    if (!REGEX_PATTERNS.LOWERCASE.test(password)) {
      return ERROR_MESSAGES.PASSWORD_LOWERCASE;
    }
    if (!REGEX_PATTERNS.NUMBER.test(password)) {
      return ERROR_MESSAGES.PASSWORD_NUMBER;
    }
  }

  return null;
};

/**
 * Validate user role
 */
export const validateUserRole = (role: string): string | null => {
  if (!role || role.trim().length === 0) {
    return ERROR_MESSAGES.ROLE_REQUIRED;
  }
  if (!USER_ROLES.includes(role as UserRole)) {
    return ERROR_MESSAGES.ROLE_INVALID;
  }

  return null;
};

/**
 * Validate user status
 */
export const validateUserStatus = (status: string): string | null => {
  if (!status || status.trim().length === 0) {
    return null; // Optional with default
  }
  if (!USER_STATUSES.includes(status as UserStatus)) {
    return ERROR_MESSAGES.USER_STATUS_INVALID;
  }

  return null;
};

/**
 * Validate inventory setting name
 */
export const validateSettingName = (name: string): string | null => {
  return validateItemName(name); // Same rules as item name
};

/**
 * Validate default unit
 */
export const validateDefaultUnit = (unit: string | null): string | null => {
  if (!unit || unit.trim().length === 0) {
    return null; // Optional field
  }

  if (unit.trim().length > VALIDATION_LIMITS.DEFAULT_UNIT_MAX) {
    return ERROR_MESSAGES.DEFAULT_UNIT_MAX;
  }

  return null;
};

/**
 * Validate low stock threshold
 */
export const validateLowStockThreshold = (threshold: number | string | null): string | null => {
  if (threshold === null || threshold === "") {
    return null; // Optional field
  }

  const num = typeof threshold === "string" ? parseInt(threshold) : threshold;

  if (isNaN(num)) {
    return null; // Optional field
  }
  if (num < VALIDATION_LIMITS.LOW_STOCK_THRESHOLD_MIN) {
    return ERROR_MESSAGES.LOW_STOCK_THRESHOLD_NEGATIVE;
  }
  if (num > VALIDATION_LIMITS.LOW_STOCK_THRESHOLD_MAX) {
    return ERROR_MESSAGES.LOW_STOCK_THRESHOLD_MAX;
  }

  return null;
};

// ===========================
// FORM VALIDATION HELPERS
// ===========================

/**
 * Validate entire inventory item form
 */
export interface InventoryItemFormData {
  item_name: string;
  category: string;
  stock_quantity: number | string;
  unit_cost?: number | string | null;
  batch_date?: string | null;
  expiration_date?: string | null;
  stock_status?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateInventoryItemForm = (
  data: InventoryItemFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  const itemNameError = validateItemName(data.item_name);
  if (itemNameError) errors.item_name = itemNameError;

  const categoryError = validateCategory(data.category);
  if (categoryError) errors.category = categoryError;

  const quantityError = validateStockQuantity(data.stock_quantity);
  if (quantityError) errors.stock_quantity = quantityError;

  if (data.unit_cost !== undefined) {
    const costError = validateUnitCost(data.unit_cost);
    if (costError) errors.unit_cost = costError;
  }

  if (data.batch_date) {
    const batchError = validateBatchDate(data.batch_date);
    if (batchError) errors.batch_date = batchError;
  }

  if (data.expiration_date) {
    const expError = validateExpirationDate(data.expiration_date, data.batch_date);
    if (expError) errors.expiration_date = expError;
  }

  if (data.stock_status) {
    const statusError = validateStockStatus(data.stock_status);
    if (statusError) errors.stock_status = statusError;
  }

  return errors;
};

/**
 * Validate user form
 */
export interface UserFormData {
  name: string;
  username: string;
  email: string;
  user_role: string;
  status?: string;
  password?: string;
}

export const validateUserForm = (
  data: UserFormData,
  requirePassword: boolean = false
): ValidationErrors => {
  const errors: ValidationErrors = {};

  const nameError = validateUserName(data.name);
  if (nameError) errors.name = nameError;

  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const roleError = validateUserRole(data.user_role);
  if (roleError) errors.user_role = roleError;

  if (data.status) {
    const statusError = validateUserStatus(data.status);
    if (statusError) errors.status = statusError;
  }

  if (data.password || requirePassword) {
    const passwordError = validatePassword(data.password || "", true);
    if (passwordError) errors.password = passwordError;
  }

  return errors;
};

/**
 * Check if validation errors object has any errors
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Get first error message from validation errors
 */
export const getFirstError = (errors: ValidationErrors): string | null => {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
};
