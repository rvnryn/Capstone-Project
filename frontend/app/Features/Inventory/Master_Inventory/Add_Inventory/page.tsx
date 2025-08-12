"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import Image from "next/image";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { useInventoryAPI } from "@/app/Features/Inventory/hook/use-inventoryAPI";
import {
  MdInventory,
  MdSave,
  MdCancel,
  MdWarning,
  MdCheckCircle,
} from "react-icons/md";
import {
  FiAlertCircle,
  FiCalendar,
  FiPackage,
  FiTag,
  FiHash,
  FiArrowRight,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";
import {
  useInventorySettingsAPI,
  InventorySetting,
} from "@/app/Features/Settings/inventory/hook/use-InventorySettingsAPI";

const CATEGORY_OPTIONS = [
  "Meats",
  "Vegetables & Fruits",
  "Dairy & Eggs",
  "Seasonings & Condiments",
  "Rice & Noodles",
  "Cooking Oils",
  "Beverage",
];

export default function AddInventoryItem() {
  const router = useRouter();
  const { isMenuOpen, isMobile } = useNavigation();
  const { addItem } = useInventoryAPI();
  const { fetchSettings } = useInventorySettingsAPI();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: 0,
    expiration_date: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    category: "",
    stock: "",
    expiration_date: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [focusedField, setFocusedField] = useState<string>("");
  const [settings, setSettings] = useState<InventorySetting[]>([]);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch((err) => {
        console.error("Failed to fetch inventory settings:", err);
        setSettings([]);
      });
  }, [fetchSettings]);

  // Validation logic
  const validate = useCallback((data: typeof formData) => {
    const newErrors = {
      name: "",
      category: "",
      stock: "",
      expiration_date: "",
    };

    // Name validation
    if (!data.name.trim()) {
      newErrors.name = "Item name is required.";
    } else if (data.name.trim().length < 2) {
      newErrors.name = "Item name must be at least 2 characters.";
    } else if (!/^[a-zA-Z0-9\s]+$/.test(data.name.trim())) {
      newErrors.name =
        "Item name can only contain letters, numbers, and spaces.";
    }

    // Category validation
    if (!data.category) {
      newErrors.category = "Category is required.";
    } else if (!CATEGORY_OPTIONS.includes(data.category)) {
      newErrors.category = "Invalid category selected.";
    }

    // Stock validation
    if (data.stock === 0 || data.stock === null || data.stock === undefined) {
      newErrors.stock = "Quantity in stock is required.";
    } else if (!Number.isInteger(data.stock) || data.stock < 1) {
      newErrors.stock = "Quantity must be a positive integer.";
    }

    // Expiration date validation (required)
    if (!data.expiration_date) {
      newErrors.expiration_date = "Expiration date is required.";
    } else {
      const today = new Date();
      const expDate = new Date(data.expiration_date);
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      if (expDate < today) {
        newErrors.expiration_date = "Expiration date cannot be in the past.";
      }
    }

    return newErrors;
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      setErrors(validate(formData));
    }
  }, [formData, validate, isSubmitted]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setIsDirty(true);
      setFormData((prev) => ({
        ...prev,
        [name]: name === "stock" ? Number(value) : value,
      }));
    },
    []
  );

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField("");
  };

  // Helper function to capitalize first letter
  function capitalizeFirstLetter(str: string) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setIsSubmitting(true);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (
      validationErrors.name ||
      validationErrors.category ||
      validationErrors.stock ||
      validationErrors.expiration_date
    ) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Get threshold for this specific item from settings
      const itemName = formData.name.trim().toLowerCase();
      const setting = settings.find(
        (s) => (s.name || "").toString().trim().toLowerCase() === itemName
      );

      // Use item-specific threshold or fallback to default
      const threshold = Number(setting?.low_stock_threshold);
      const fallbackThreshold = 100; // Default fallback
      const useThreshold =
        !isNaN(threshold) && threshold > 0 ? threshold : fallbackThreshold;

      let stockStatus: "Normal" | "Critical" | "Low" | "Out Of Stock" =
        "Normal";

      // Determine stock status based on comprehensive business logic
      if (formData.stock === 0) {
        stockStatus = "Out Of Stock";
      } else if (formData.stock <= useThreshold * 0.5) {
        // Critical: when stock is 50% or less of the threshold
        stockStatus = "Critical";
      } else if (formData.stock <= useThreshold) {
        // Low: when stock is at or below threshold but above critical
        stockStatus = "Low";
      } else {
        // Normal: when stock is above threshold
        stockStatus = "Normal";
      }

      const today = new Date();
      const batchDate = today.toISOString().split("T")[0];

      await addItem({
        item_name: capitalizeFirstLetter(formData.name.trim()),
        category: formData.category,
        stock_quantity: formData.stock,
        stock_status: stockStatus,
        batch_date: batchDate,
        expiration_date: formData.expiration_date,
      });

      setShowSuccessMessage(true);
      setFormData({ name: "", category: "", stock: 0, expiration_date: "" });
      setIsDirty(false);

      // Show success message for 2 seconds then redirect
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.push(routes.master_inventory);
      }, 2000);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      alert("Failed to add inventory item. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      router.push(routes.master_inventory);
    }
  };

  const handleConfirmCancel = (confirm: boolean) => {
    if (confirm) {
      router.push(routes.master_inventory);
    }
    setShowCancelModal(false);
  };

  useEffect(() => {
    setInitialSettings({
      name: "",
      category: "",
      stock: 0,
      expiration_date: "",
    });
  }, []);

  const isSettingsChanged = () => {
    if (!initialSettings) return false;
    return (
      initialSettings.name !== formData.name ||
      initialSettings.category !== formData.category ||
      initialSettings.stock !== formData.stock ||
      initialSettings.expiration_date !== formData.expiration_date
    );
  };

  const handleSidebarNavigate = (path: string) => {
    if (isSettingsChanged()) {
      setShowUnsavedModal(true);
      setPendingRoute(path);
      return false;
    }
    return true;
  };

  const handleConfirmUnsaved = () => {
    setShowUnsavedModal(false);
    if (pendingRoute) {
      router.push(pendingRoute);
      setPendingRoute(null);
    }
  };
  const handleCancelUnsaved = () => {
    setShowUnsavedModal(false);
    setPendingRoute(null);
  };

  return (
    <section>
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showCancelModal={showCancelModal}
        showUnsavedModal={showUnsavedModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Add Master Inventory main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            {/* Success Message */}
            {showSuccessMessage && (
              <aside
                role="status"
                aria-live="polite"
                className="mb-3 xs:mb-4 sm:mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 xs:gap-3">
                  <MdCheckCircle className="text-green-400 text-lg xs:text-xl sm:text-2xl" />
                  <div>
                    <h3 className="text-green-400 font-semibold text-sm xs:text-base">
                      Success!
                    </h3>
                    <p className="text-green-300 text-xs xs:text-sm">
                      Inventory item added successfully. Redirecting...
                    </p>
                  </div>
                </div>
              </aside>
            )}

            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 2xl:p-16 w-full">
              {/* Header with improved visual hierarchy */}
              <header className="flex items-center gap-3 xs:gap-4 sm:gap-5 mb-4 xs:mb-6 sm:mb-8 md:mb-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-sm xs:blur-md sm:blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 xs:p-3 sm:p-4 rounded-full">
                    <MdInventory className="text-black text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                    Add Inventory Item
                  </h1>
                  <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                    Add new items to your master inventory
                  </p>
                </div>
              </header>

              {/* Elegant divider */}
              <div
                className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8"
                aria-hidden="true"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/70 text-xs xs:text-sm">
                    Enter Item Details
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8"
                aria-label="Add Inventory Item Form"
              >
                <fieldset className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                  {/* Item Name Field */}
                  <div className="group">
                    <label
                      htmlFor="name"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      <FiTag className="text-yellow-400 text-xs xs:text-sm" />
                      Item Name
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => handleFocus("name")}
                        onBlur={handleBlur}
                        placeholder="Enter item name..."
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 placeholder-gray-500 ${
                          errors.name
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : focusedField === "name"
                            ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.name}
                        aria-describedby={
                          errors.name ? "name-error" : undefined
                        }
                      />
                      {focusedField === "name" && !errors.name && (
                        <div className="absolute right-2 xs:right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {errors.name && (
                      <div
                        id="name-error"
                        className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        <FiAlertCircle className="flex-shrink-0" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  {/* Category Field */}
                  <div className="group">
                    <label
                      htmlFor="category"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      <FiPackage className="text-yellow-400 text-xs xs:text-sm" />
                      Category
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="category"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                        onFocus={() => handleFocus("category")}
                        onBlur={handleBlur}
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 cursor-pointer ${
                          errors.category
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : focusedField === "category"
                            ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.category}
                        aria-describedby={
                          errors.category ? "category-error" : undefined
                        }
                      >
                        <option value="" className="bg-gray-800">
                          Select Category...
                        </option>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat} className="bg-gray-800">
                            {cat}
                          </option>
                        ))}
                      </select>
                      {focusedField === "category" && !errors.category && (
                        <div className="absolute right-6 xs:right-8 top-1/2 transform -translate-y-1/2">
                          <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {errors.category && (
                      <div
                        id="category-error"
                        className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        <FiAlertCircle className="flex-shrink-0" />
                        {errors.category}
                      </div>
                    )}
                  </div>

                  {/* Stock Quantity Field */}
                  <div className="group">
                    <label
                      htmlFor="stock"
                      className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      <FiHash className="text-yellow-400" />
                      Quantity In Stock
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        required
                        min={1}
                        value={formData.stock === 0 ? "" : formData.stock}
                        onChange={handleChange}
                        onFocus={() => handleFocus("stock")}
                        onBlur={handleBlur}
                        placeholder="Enter quantity..."
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 placeholder-gray-500 ${
                          errors.stock
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : focusedField === "stock"
                            ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.stock}
                        aria-describedby={
                          errors.stock ? "stock-error" : undefined
                        }
                      />
                      {focusedField === "stock" && !errors.stock && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {errors.stock && (
                      <div
                        id="stock-error"
                        className="flex items-center gap-2 mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        <FiAlertCircle className="flex-shrink-0" />
                        {errors.stock}
                      </div>
                    )}
                  </div>

                  {/* Expiration Date Field */}
                  <div className="group">
                    <label
                      htmlFor="expiration_date"
                      className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      <FiCalendar className="text-yellow-400" />
                      Expiration Date
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="expiration_date"
                        name="expiration_date"
                        required
                        value={formData.expiration_date}
                        onChange={handleChange}
                        onFocus={() => handleFocus("expiration_date")}
                        onBlur={handleBlur}
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-4 md:py-5 border-2 text-sm xs:text-base sm:text-lg transition-all duration-300 ${
                          errors.expiration_date
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : focusedField === "expiration_date"
                            ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        aria-invalid={!!errors.expiration_date}
                        aria-describedby={
                          errors.expiration_date
                            ? "expiration-error"
                            : undefined
                        }
                      />
                      {focusedField === "expiration_date" &&
                        !errors.expiration_date && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          </div>
                        )}
                    </div>
                    {errors.expiration_date && (
                      <div
                        id="expiration-error"
                        className="flex items-center gap-2 mt-2 text-red-400 text-xs sm:text-sm"
                        role="alert"
                      >
                        <FiAlertCircle className="flex-shrink-0" />
                        {errors.expiration_date}
                      </div>
                    )}
                  </div>
                </fieldset>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 md:gap-4 pt-4 xs:pt-5 sm:pt-6 md:pt-8 border-t border-gray-700/50">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex items-center justify-center gap-2 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 xs:px-5 sm:px-6 md:px-8 py-3 xs:py-4 sm:py-4 rounded-lg xs:rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm xs:text-base sm:text-base w-full sm:w-auto shadow-lg hover:shadow-yellow-400/25"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 xs:w-4 h-3 xs:h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <MdSave className="group-hover:scale-110 transition-transform duration-300 text-xs xs:text-sm sm:text-base" />
                        Add Item
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="group flex items-center justify-center gap-2 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-8 py-3 xs:py-4 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 cursor-pointer text-sm xs:text-base sm:text-base w-full sm:w-auto"
                  >
                    <MdCancel className="group-hover:rotate-180 transition-transform duration-300 text-base xs:text-lg sm:text-base" />
                    Cancel
                  </button>
                </div>
              </form>
            </article>
          </div>
        </main>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-full flex items-center justify-center">
                <MdCancel className="w-8 h-8 text-red-400" />
              </div>
              <h3
                id="transfer-dialog-title"
                className="text-xl sm:text-2xl font-bold text-white mb-2"
              >
                Cancel Changes
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                Are you sure you want to cancel? All unsaved changes will be
                lost.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">No, Go Back</span>
                  <span className="sm:hidden">Keep</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmCancel(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-300 hover:to-red-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-red-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                  <span className="hidden sm:inline">Yes, Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Unsaved Changes Modal */}
        {showUnsavedModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
              <h3
                id="transfer-dialog-title"
                className="text-xl sm:text-2xl font-bold text-white mb-2"
              >
                Unsaved Changes
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                You have unsaved changes. Are you sure you want to leave without
                saving?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleCancelUnsaved}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnsaved}
                  className="flex-2 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-orange-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiArrowRight className="w-5 h-5" />
                  <span className="hidden sm:inline">Leave Without Saving</span>
                  <span className="sm:hidden">Leave</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
