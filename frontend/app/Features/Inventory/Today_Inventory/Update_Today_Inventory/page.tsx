/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { routes } from "@/app/routes/routes";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import NavigationBar from "@/app/components/navigation/navigation";
import {
  MdInventory,
  MdSave,
  MdCancel,
  MdWarning,
  MdCheckCircle,
  MdEdit,
} from "react-icons/md";
import {
  FiPackage,
  FiCalendar,
  FiTag,
  FiHash,
  FiLock,
  FiAlertCircle,
  FiSave,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiArrowRight,
} from "react-icons/fi";
import { useInventoryAPI } from "@/app/Features/Inventory/hook/use-inventoryAPI";

const CATEGORY_OPTIONS = [
  "Meats",
  "Vegetables & Fruits",
  "Dairy & Eggs",
  "Seasonings & Condiments",
  "Rice & Noodles",
  "Cooking Oils",
  "Beverage",
];

export default function EditTodayInventoryItem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getTodayItem, updateTodayItem } = useInventoryAPI();
  const itemId = searchParams.get("id");

  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState({
    name: "",
    category: "",
    stock: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [focusedField, setFocusedField] = useState<string>("");

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        router.push(routes.todays_inventory);
        return;
      }

      try {
        const data = await getTodayItem(itemId);

        const mappedItem = {
          id: data.item_id,
          name: data.item_name,
          batch: data.batch_date,
          category: data.category,
          stock: data.stock_quantity,
          status: data.stock_status,
          added: new Date(data.created_at),
          expiration_date: data.expiration_date?.split("T")[0] || "",
        };

        setFormData(mappedItem);
        setInitialSettings(mappedItem);
      } catch (error) {
        console.error("Error fetching item:", error);
        router.push(routes.todays_inventory);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId, router, getTodayItem]);

  const validate = useCallback((data: any) => {
    const newErrors = {
      name: "",
      category: "",
      stock: "",
    };

    if (!data.name || !data.name.trim()) {
      newErrors.name = "Item name is required.";
    } else if (data.name.trim().length < 2) {
      newErrors.name = "Item name must be at least 2 characters.";
    } else if (!/^[a-zA-Z0-9\s]+$/.test(data.name.trim())) {
      newErrors.name =
        "Item name can only contain letters, numbers, and spaces.";
    }

    if (!data.category) {
      newErrors.category = "Category is required.";
    } else if (!CATEGORY_OPTIONS.includes(data.category)) {
      newErrors.category = "Invalid category selected.";
    }

    if (data.stock === null || data.stock === undefined || data.stock === "") {
      newErrors.stock = "Quantity in stock is required.";
    } else if (
      !Number.isInteger(Number(data.stock)) ||
      Number(data.stock) < 0
    ) {
      newErrors.stock = "Quantity must be a non-negative integer.";
    }

    return newErrors;
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      setErrors(validate(formData));
    }
  }, [formData, validate, isSubmitted]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData((prev: any) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  };

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;

    setIsSubmitted(true);
    setIsSubmitting(true);
    setErrorMessage(null);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (
      validationErrors.name ||
      validationErrors.category ||
      validationErrors.stock
    ) {
      setIsSubmitting(false);
      return;
    }

    try {
      await updateTodayItem(itemId, {
        item_name: formData.name.trim(),
        category: formData.category,
        batch_date: formData.batch,
        stock_quantity: formData.stock,
        expiration_date: formData.expiration_date || null,
      });

      setShowSuccessMessage(true);
      setIsDirty(false);

      setTimeout(() => {
        setShowSuccessMessage(false);
        router.push(routes.todays_inventory);
      }, 2000);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      setErrorMessage("Failed to update the inventory item. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSaveClick = () => {
    if (isDirty) {
      setShowSaveModal(true);
    } else {
      router.push(routes.todays_inventory);
    }
  };

  const handleConfirmSave = () => {
    setShowSaveModal(false);
    handleSubmit(new Event("submit") as unknown as React.FormEvent);
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      router.push(routes.todays_inventory);
    }
  };

  const handleConfirmCancel = (confirm: boolean) => {
    if (confirm) {
      router.push(routes.todays_inventory);
    }
    setShowCancelModal(false);
  };

  const isSettingsChanged = () => {
    if (!initialSettings) return false;
    return (
      initialSettings.name !== formData.name ||
      initialSettings.category !== formData.category ||
      initialSettings.stock !== formData.stock
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

  if (isLoading) {
    return (
      <section className="text-white font-poppins w-full min-h-screen">
        <NavigationBar onNavigate={handleSidebarNavigate} />
        <ResponsiveMain>
          <main
            className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
            aria-label="Edit Today's Inventory main content"
            tabIndex={-1}
          >
            <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
                <div className="flex flex-row items-center justify-center gap-4 mb-6 w-full">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                    <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full">
                      <MdEdit className="text-black text-2xl md:text-3xl lg:text-4xl" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center w-full">
                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins text-left w-full">
                      Edit Today's Inventory Item
                    </h2>
                    <p className="text-gray-400 text-base mt-1 text-left w-full">
                      Update today's item details and stock quantity
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex flex-col items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12 border-2 xs:border-3 sm:border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                    <div className="text-yellow-400 font-medium text-sm xs:text-base">
                      Loading item details...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  return (
    <section className="text-white font-poppins w-full min-h-screen">
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showUnsavedModal={showUnsavedModal}
        showCancelModal={showCancelModal}
        showSaveModal={showSaveModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Edit Today's Inventory main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <div className="flex flex-row items-center justify-center gap-4 mb-6 w-full">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full">
                    <MdEdit className="text-black text-2xl md:text-3xl lg:text-4xl" />
                  </div>
                </div>
                <div className="flex flex-col justify-center w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins text-left w-full">
                    Edit Today's Inventory Item
                  </h2>
                  <p className="text-gray-400 text-base mt-1 text-left w-full">
                    Update today's item details and stock quantity
                  </p>
                </div>
              </div>

              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/70 text-xs xs:text-sm">
                    Item Details
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                  {/* Batch Date Field (Read-only) */}
                  <div className="group">
                    <label
                      htmlFor="batch"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base"
                    >
                      <FiCalendar className="text-gray-500 text-xs xs:text-sm" />
                      Batch Date
                      <FiLock className="text-gray-500 text-xs" />
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="batch"
                        name="batch"
                        disabled
                        value={formData.batch || ""}
                        className="w-full bg-gray-700/50 text-gray-400 rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 border-gray-600/30 cursor-not-allowed text-xs xs:text-sm sm:text-base"
                      />
                    </div>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 xs:mt-2 flex items-center gap-1">
                      <FiLock className="text-xs" />
                      Batch date cannot be changed
                    </p>
                  </div>

                  {/* Expiration Date Field (Read-only) */}
                  <div className="group">
                    <label
                      htmlFor="expiration_date"
                      className="flex items-center gap-1 xs:gap-2 text-gray-300 mb-1.5 xs:mb-2 sm:mb-3 font-medium text-xs xs:text-sm sm:text-base"
                    >
                      <FiCalendar className="text-gray-500 text-xs xs:text-sm" />
                      Expiration Date
                      <FiLock className="text-gray-500 text-xs" />
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="expiration_date"
                        name="expiration_date"
                        disabled
                        value={formData.expiration_date || ""}
                        className="w-full bg-gray-700/50 text-gray-400 rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 border-gray-600/30 cursor-not-allowed text-xs xs:text-sm sm:text-base"
                      />
                    </div>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 xs:mt-2 flex items-center gap-1">
                      <FiLock className="text-xs" />
                      Expiration date cannot be changed
                    </p>
                  </div>

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
                        value={formData.name || ""}
                        onChange={handleChange}
                        onFocus={() => handleFocus("name")}
                        onBlur={handleBlur}
                        placeholder="Enter item name..."
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 ${
                          isSubmitted && errors.name
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : focusedField === "name"
                            ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                      />
                      {focusedField === "name" && !errors.name && (
                        <div className="absolute right-2 xs:right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {isSubmitted && errors.name && (
                      <div className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2 text-red-400 text-xs sm:text-sm">
                        <FiAlertCircle className="flex-shrink-0" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  {/* Category Field */}
                  <div className="group">
                    <label
                      htmlFor="category"
                      className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      <FiPackage className="text-yellow-400" />
                      Category
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="category"
                        name="category"
                        required
                        value={formData.category || ""}
                        onChange={handleChange}
                        onFocus={() => handleFocus("category")}
                        onBlur={handleBlur}
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 cursor-pointer ${
                          isSubmitted && errors.category
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : focusedField === "category"
                            ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
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
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {isSubmitted && errors.category && (
                      <div className="flex items-center gap-2 mt-2 text-red-400 text-xs sm:text-sm">
                        <FiAlertCircle className="flex-shrink-0" />
                        {errors.category}
                      </div>
                    )}
                  </div>

                  {/* Stock Quantity Field */}
                  <div className="group lg:col-span-2">
                    <label
                      htmlFor="stock"
                      className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                    >
                      <FiHash className="text-yellow-400" />
                      Quantity In Stock
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative max-w-md">
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        required
                        min={0}
                        value={formData.stock === 0 ? "" : formData.stock}
                        onChange={handleChange}
                        onFocus={() => handleFocus("stock")}
                        onBlur={handleBlur}
                        placeholder="Enter quantity..."
                        className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 placeholder-gray-500 ${
                          isSubmitted && errors.stock
                            ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                            : focusedField === "stock"
                            ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                            : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        }`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      {focusedField === "stock" && !errors.stock && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {isSubmitted && errors.stock && (
                      <div className="flex items-center gap-2 mt-2 text-red-400 text-xs sm:text-sm">
                        <FiAlertCircle className="flex-shrink-0" />
                        {errors.stock}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 md:gap-4 pt-4 xs:pt-5 sm:pt-6 md:pt-8 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto order-2 xs:order-1"
                  >
                    <MdCancel className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-300" />
                    <span className="hidden xs:inline">Cancel</span>
                    <span className="xs:hidden">Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={isSubmitting}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl font-medium xs:font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto shadow-lg hover:shadow-yellow-400/25 order-1 xs:order-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        <span className="hidden xs:inline">Saving...</span>
                        <span className="xs:hidden">Save</span>
                      </>
                    ) : (
                      <>
                        <MdSave className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="hidden sm:inline">Save Changes</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </button>
                </div>

                {errorMessage && (
                  <div className="mt-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <FiAlertCircle className="flex-shrink-0" />
                      <p className="text-sm">{errorMessage}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>

        {/* Save Confirmation Modal */}
        {showSaveModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center">
                <FiSave className="w-8 h-8 text-yellow-400" />
              </div>
              <h3
                id="save-dialog-title"
                className="text-xl sm:text-2xl font-bold text-white mb-2"
              >
                Save Changes
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                Are you sure you want to save these changes to the inventory
                item?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg hover:shadow-yellow-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Saving...</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-5 h-5" />
                      <span className="hidden sm:inline">Confirm</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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

        {showSuccessMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-5 xs:w-6 h-5 xs:h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCheck className="w-3 xs:w-4 h-3 xs:h-4 text-white" />
              </div>
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                Today's inventory updated successfully!
              </span>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
