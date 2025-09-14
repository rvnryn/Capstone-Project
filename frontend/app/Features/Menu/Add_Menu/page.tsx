"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NavigationBar from "@/app/components/navigation/navigation";
import { useMenuAPI } from "../hook/use-menu";
import { routes } from "@/app/routes/routes";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { FaUtensils } from "react-icons/fa";
import { MdCancel, MdSave } from "react-icons/md";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiX,
} from "react-icons/fi";

export default function AddMenuPage() {
  const router = useRouter();
  const { addMenuWithImageAndIngredients } = useMenuAPI();

  const [formData, setFormData] = useState({
    dish_name: "",
    category: "",
    price: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);
  const [showRemoveIngredientModal, setShowRemoveIngredientModal] =
    useState(false);
  const [ingredientToRemoveIdx, setIngredientToRemoveIdx] = useState<
    number | null
  >(null);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setIsDirty(true);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsDirty(true);
    }
  };

  const handleIngredientChange = (
    idx: number,
    field: string,
    value: string
  ) => {
    setIngredients((ings) =>
      ings.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  };
  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", quantity: "" }]);

  const removeIngredient = (idx: number) => {
    setIngredientToRemoveIdx(idx);
    setShowRemoveIngredientModal(true);
  };

  const confirmRemoveIngredient = () => {
    if (ingredientToRemoveIdx !== null) {
      setIngredients((ings) =>
        ings.filter((_, i) => i !== ingredientToRemoveIdx)
      );
      setShowRemoveIngredientModal(false);
      setIngredientToRemoveIdx(null);
    }
  };
  const cancelRemoveIngredient = () => {
    setShowRemoveIngredientModal(false);
    setIngredientToRemoveIdx(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (
      !formData.dish_name ||
      !formData.category ||
      !formData.price ||
      !selectedImage
    ) {
      setError("Please fill all the fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare valid ingredients (skip empty rows)
      const validIngredients = ingredients
        .filter((ing) => ing.name.trim() && ing.quantity.trim())
        .map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
        }));

      // Step: Create menu item with image and ingredients
      const form = new FormData();
      form.append("dish_name", formData.dish_name);
      form.append("category", formData.category);
      form.append("price", formData.price);
      form.append("file", selectedImage);
      form.append("ingredients", JSON.stringify(validIngredients));

      await addMenuWithImageAndIngredients(form);

      setShowSuccessMessage(true);
      setFormData({ dish_name: "", category: "", price: "" });
      setSelectedImage(null);
      setPreviewUrl(null);
      setIsDirty(false);
      router.push(routes.menu);
    } catch {
      setError("There was an error while adding the menu item.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (
      formData.dish_name ||
      formData.category ||
      formData.price ||
      selectedImage
    ) {
      setShowCancelModal(true);
    } else {
      router.push(routes.menu);
    }
  };

  const handleConfirmCancel = (confirm: boolean) => {
    if (confirm) {
      router.push(routes.menu);
    }
    setShowCancelModal(false);
  };

  useEffect(() => {
    setInitialSettings({
      dish_name: "",
      category: "",
      price: "",
      ingredients: [{ name: "", quantity: "" }],
      image: null,
    });
  }, []);

  const isSettingsChanged = () => {
    if (!initialSettings) return false;
    return (
      initialSettings.dish_name !== formData.dish_name ||
      initialSettings.category !== formData.category ||
      initialSettings.price !== formData.price ||
      JSON.stringify(initialSettings.ingredients) !==
        JSON.stringify(ingredients) ||
      initialSettings.image !== selectedImage
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
    <section className="text-white font-poppins w-full min-h-screen">
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showCancelModal={showCancelModal}
        showRemoveIngredientModal={showRemoveIngredientModal}
        showUnsavedModal={showUnsavedModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Add Menu main content"
          tabIndex={-1}
        >
          <div className="max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl 2xl:max-w-5xl mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <div className="flex flex-row items-center justify-center gap-4 mb-6 w-full">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full">
                    <FaUtensils className="text-black text-2xl md:text-3xl lg:text-4xl" />
                  </div>
                </div>
                <div className="flex flex-col justify-center w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins text-left w-full">
                    Add Menu Item
                  </h2>
                  <p className="text-gray-400 text-base mt-1 text-left w-full">
                    Add new dishes to your menu
                  </p>
                </div>
              </div>
              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/70 text-xs xs:text-sm">
                    Enter Dish Details
                  </span>
                </div>
              </div>
              <form
                onSubmit={handleSubmit}
                className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                  <div className="space-y-4">
                    <div className="group">
                      <label
                        htmlFor="dish_name"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Dish Name
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="dish_name"
                        name="dish_name"
                        required
                        value={formData.dish_name}
                        onChange={handleChange}
                        placeholder="Enter dish name..."
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                      />
                    </div>
                    <div className="group">
                      <label
                        htmlFor="category"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Category
                        <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 cursor-pointer border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                      >
                        <option value="" className="bg-gray-800">
                          Select Category...
                        </option>
                        <option>Soup & Noodles</option>
                        <option>Rice Toppings</option>
                        <option>Sizzlers</option>
                        <option>Extras</option>
                        <option>Desserts</option>
                        <option>Beverage</option>
                      </select>
                    </div>
                    <div className="group">
                      <label
                        htmlFor="price"
                        className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                      >
                        Price (₱)
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        required
                        min={0}
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Enter price..."
                        className="w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 placeholder-gray-500 border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center w-full gap-2">
                    <label className="flex items-center gap-2 text-gray-300 mb-2 font-medium text-sm sm:text-base">
                      Dish Image
                    </label>
                    <div className="relative w-32 h-32 xs:w-44 xs:h-44 md:w-44 md:h-52 border-2 border-dashed border-yellow-400/40 bg-gray-900 rounded-lg flex items-center justify-center">
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt="Selected"
                          width={208}
                          height={208}
                          className="w-full h-full object-contain rounded-lg shadow-xl"
                          style={{ objectFit: "contain" }}
                          unoptimized
                        />
                      ) : (
                        <span className="text-gray-500">No Image</span>
                      )}
                    </div>
                    <label className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-0.5 rounded-lg font-semibold shadow cursor-pointer transition">
                      Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-gray-400 mt-1">
                      Choose an image to upload.
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-lg">
                    Ingredients
                  </label>
                  <div className="space-y-2">
                    {ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex flex-row items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-700 w-full"
                        style={{ minWidth: 0 }}
                      >
                        <input
                          type="text"
                          placeholder="Ingredient Name"
                          value={ing.name}
                          onChange={(e) =>
                            handleIngredientChange(idx, "name", e.target.value)
                          }
                          className="flex-1 min-w-0 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-400 focus:outline-none transition text-xs xs:text-sm sm:text-base"
                        />
                        <input
                          type="text"
                          placeholder="Quantity (e.g. 100g, 1 cup)"
                          value={ing.quantity}
                          onChange={(e) =>
                            handleIngredientChange(
                              idx,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="flex-1 min-w-0 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-400 focus:outline-none transition text-xs xs:text-sm sm:text-base"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(idx)}
                          className="text-red-400 hover:text-red-200 font-semibold px-3 py-2 transition rounded-lg focus:outline-none text-xs xs:text-sm sm:text-base"
                          aria-label="Remove ingredient"
                          disabled={ingredients.length < 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="mt-3 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg font-semibold shadow transition focus:outline-none"
                    >
                      + Add Ingredient
                    </button>
                    <p className="text-gray-400 text-xs mt-2">
                      Tip: Add all ingredients with their amounts. You can
                      remove or edit any ingredient before saving.
                    </p>
                  </div>
                  {error && (
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded text-sm mt-2">
                      {error}
                    </div>
                  )}
                </div>
                <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 md:gap-4 pt-4 xs:pt-5 sm:pt-6 md:pt-8 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto order-2 xs:order-1"
                    style={{ minWidth: 0 }}
                  >
                    <MdCancel className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-300" />
                    <span className="hidden xs:inline">Cancel</span>
                    <span className="xs:hidden">Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex items-center justify-center gap-1.5 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl font-medium xs:font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto shadow-lg hover:shadow-yellow-400/25 order-1 xs:order-2"
                    style={{ minWidth: 0 }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        <span className="hidden xs:inline">Adding...</span>
                        <span className="xs:hidden">Add</span>
                      </>
                    ) : (
                      <>
                        <MdSave className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="hidden sm:inline">Add Item</span>
                        <span className="sm:hidden">Add</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
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

        {/* Remove Ingredient Modal */}
        {showRemoveIngredientModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-ingredient-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3
                id="remove-ingredient-dialog-title"
                className="text-xl sm:text-2xl font-bold text-white mb-2"
              >
                Remove Ingredient
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                Are you sure you want to remove this ingredient?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={cancelRemoveIngredient}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveIngredient}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-300 hover:to-red-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-red-400/25 order-1 sm:order-2 cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                  Remove
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
        {showSuccessMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-5 xs:w-6 h-5 xs:h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCheck className="w-3 xs:w-4 h-3 xs:h-4 text-white" />
              </div>
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                Menu item added successfully!
              </span>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
