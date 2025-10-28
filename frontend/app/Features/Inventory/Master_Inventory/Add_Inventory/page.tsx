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
  FiCheck,
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

  // Track online/offline status
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(typeof window !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
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
  const [hasExpiration, setHasExpiration] = useState(false);

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
  const validate = useCallback(
    (data: typeof formData) => {
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
      if (data.stock === null || data.stock === undefined) {
        newErrors.stock = "Quantity in stock is required.";
      } else if (!Number.isInteger(data.stock)) {
        newErrors.stock = "Quantity must be an integer.";
      } else if (data.stock < 1) {
        newErrors.stock = "Quantity must be a positive integer.";
      }

      if (hasExpiration && data.expiration_date) {
        const today = new Date();
        const expDate = new Date(data.expiration_date);
        today.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);
        if (expDate < today) {
          newErrors.expiration_date = "Expiration date cannot be in the past.";
        }
      }

      return newErrors;
    },
    [CATEGORY_OPTIONS]
  );

  useEffect(() => {
    if (isSubmitted) {
      setErrors(
        validate(formData) ?? {
          name: "",
          category: "",
          stock: "",
          expiration_date: "",
        }
      );
    }
  }, [formData, validate, isSubmitted]);

  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setIsDirty(true);
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "number"
            ? value === ""
              ? 0
              : Number(value)
            : capitalizeWords(value),
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

    const validationErrors = validate(formData) ?? {
      name: "",
      category: "",
      stock: "",
      expiration_date: "",
    };
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
        expiration_date:
          hasExpiration && formData.expiration_date
            ? formData.expiration_date
            : null,
      });

      setShowSuccessMessage(true);
      setFormData({ name: "", category: "", stock: 0, expiration_date: "" });
      setIsDirty(false);
      setIsSubmitted(false);

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
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 2xl:p-16 w-full">
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

              {/* Show offline message and disable form if offline */}
              {!isOnline && (
                <div className="mb-6 p-4 bg-yellow-900/80 border border-yellow-500/40 rounded-xl text-yellow-300 text-center font-semibold">
                  <span>
                    <MdWarning className="inline mr-2 text-yellow-400 text-lg align-text-bottom" />
                    You are offline. Adding inventory is <b>disabled</b> while
                    offline. Please reconnect to add items.
                  </span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8"
                aria-label="Add Inventory Item Form"
              >
                <fieldset
                  className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8"
                  disabled={!isOnline}
                  style={
                    !isOnline ? { opacity: 0.6, pointerEvents: "none" } : {}
                  }
                >
                  {/* Item Name Field */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block font-semibold text-gray-200 mb-1"
                    >
                      Item Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => handleFocus("name")}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.name
                          ? "border-red-500"
                          : focusedField === "name"
                          ? "border-yellow-400"
                          : "border-gray-700"
                      } bg-gray-900 text-white placeholder-gray-500 focus:outline-none transition-all duration-300`}
                      placeholder="Enter item name"
                      autoComplete="off"
                      required
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && (
                      <span
                        id="name-error"
                        className="text-red-400 text-xs mt-1 flex items-center gap-1"
                      >
                        <FiAlertCircle className="inline-block mr-1" />
                        {errors.name}
                      </span>
                    )}
                  </div>
                  {/* Category Field */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block font-semibold text-gray-200 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      onFocus={() => handleFocus("category")}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.category
                          ? "border-red-500"
                          : focusedField === "category"
                          ? "border-yellow-400"
                          : "border-gray-700"
                      } bg-gray-900 text-white placeholder-gray-500 focus:outline-none transition-all duration-300`}
                      required
                      aria-invalid={!!errors.category}
                      aria-describedby={
                        errors.category ? "category-error" : undefined
                      }
                    >
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <span
                        id="category-error"
                        className="text-red-400 text-xs mt-1 flex items-center gap-1"
                      >
                        <FiAlertCircle className="inline-block mr-1" />
                        {errors.category}
                      </span>
                    )}
                  </div>
                  {/* Stock Quantity Field */}
                  <div>
                    <label
                      htmlFor="stock"
                      className="block font-semibold text-gray-200 mb-1"
                    >
                      Quantity in Stock
                    </label>
                    <input
                      id="stock"
                      name="stock"
                      type="number"
                      min={1}
                      value={formData.stock === 0 ? "" : formData.stock}
                      onChange={handleChange}
                      onFocus={() => handleFocus("stock")}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.stock
                          ? "border-red-500"
                          : focusedField === "stock"
                          ? "border-yellow-400"
                          : "border-gray-700"
                      } bg-gray-900 text-white placeholder-gray-500 focus:outline-none transition-all duration-300`}
                      placeholder="Enter quantity"
                      required
                      aria-invalid={!!errors.stock}
                      aria-describedby={
                        errors.stock ? "stock-error" : undefined
                      }
                    />
                    {errors.stock && (
                      <span
                        id="stock-error"
                        className="text-red-400 text-xs mt-1 flex items-center gap-1"
                      >
                        <FiAlertCircle className="inline-block mr-1" />
                        {errors.stock}
                      </span>
                    )}
                  </div>
                  {/* Expiration Date Field */}
                  <div>
                    <label
                      htmlFor="expiration_date"
                      className="block font-semibold text-gray-200 mb-1"
                    >
                      Expiration Date
                    </label>
                    <input
                      id="expiration_date"
                      name="expiration_date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={handleChange}
                      onFocus={() => handleFocus("expiration_date")}
                      onBlur={handleBlur}
                      disabled={!hasExpiration}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.expiration_date
                          ? "border-red-500"
                          : focusedField === "expiration_date"
                          ? "border-yellow-400"
                          : "border-gray-700"
                      } bg-gray-900 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                        !hasExpiration ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      aria-invalid={!!errors.expiration_date}
                      aria-describedby={
                        errors.expiration_date ? "expiration-error" : undefined
                      }
                    />
                    {errors.expiration_date && (
                      <span
                        id="expiration-error"
                        className="text-red-400 text-xs mt-1 flex items-center gap-1"
                      >
                        <FiAlertCircle className="inline-block mr-1" />
                        {errors.expiration_date}
                      </span>
                    )}
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="hasExpiration"
                        checked={hasExpiration}
                        onChange={() => {
                          setHasExpiration((prev) => !prev);
                          if (!hasExpiration) {
                            setFormData((prev) => ({
                              ...prev,
                              expiration_date: "",
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <label
                        htmlFor="hasExpiration"
                        className="text-gray-200 font-semibold"
                      >
                        Has Expiration Date
                      </label>
                    </div>
                  </div>
                </fieldset>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 md:gap-4 pt-4 xs:pt-5 sm:pt-6 md:pt-8 border-t border-gray-700/50">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isOnline}
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
                    disabled={!isOnline}
                    className="group flex items-center justify-center gap-2 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-8 py-3 xs:py-4 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 cursor-pointer text-sm xs:text-base sm:text-base w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onClick={() => handleConfirmCancel(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-300 hover:to-red-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-red-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                  <span className="hidden sm:inline">Yes, Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">No, Go Back</span>
                  <span className="sm:hidden">Keep</span>
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
                  onClick={handleConfirmUnsaved}
                  className="flex-2 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-orange-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiArrowRight className="w-5 h-5" />
                  <span className="hidden sm:inline">Leave Without Saving</span>
                  <span className="sm:hidden">Leave</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelUnsaved}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Stay
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-5 xs:w-6 h-5 xs:h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCheck className="w-3 xs:w-4 h-3 xs:h-4 text-white" />
              </div>
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                Master Inventory item added successfully!
              </span>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
