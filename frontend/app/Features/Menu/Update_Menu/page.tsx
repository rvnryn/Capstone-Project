"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import NavigationBar from "@/app/components/navigation/navigation";
import { useMenuAPI } from "../hook/use-menu";
import { routes } from "@/app/routes/routes";
import { useQuery } from "@tanstack/react-query";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { MdEdit, MdSave, MdCancel, MdCheckCircle } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import {
  FiTag,
  FiPackage,
  FiHash,
  FiAlertCircle,
  FiSave,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiArrowRight,
  FiImage,
  FiFileText,
} from "react-icons/fi";
import { useInventoryItemNames } from "@/app/hooks/Itemnames";
import { getUnitsForCategory } from "@/app/constants/unitOptions";

const CATEGORY_OPTIONS = [
  "Bagnet Meals",
  "Sizzlers",
  "Unli Rice w/ Bone Marrow",
  "Soups w/ Bone Marrow",
  "Combo",
  "For Sharing",
  "Noodles",
  "Desserts",
  "Sides",
  "Drinks",
  "Extras",
];

export default function EditMenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menu_id = Number(searchParams.get("id"));
  const {
    updateMenu,
    updateMenuWithImageAndIngredients,
    fetchMenuById,
    deleteIngredientFromMenu,
  } = useMenuAPI();
  const { items, loading: itemNamesLoading } = useInventoryItemNames();

  // Fetch menu by id with localStorage fallback for offline support
  const { data: menu, isLoading } = useQuery({
    queryKey: ["menu", menu_id],
    queryFn: async () => {
      let menuData = null;
      let fromCache = false;
      if (typeof window !== "undefined" && !navigator.onLine) {
        // Offline: try to get from localStorage
        const cached = localStorage.getItem(`menuCache_${menu_id}`);
        if (cached) {
          menuData = JSON.parse(cached);
          fromCache = true;
        }
      }
      if (!fromCache) {
        menuData = await fetchMenuById(menu_id);
        // Save to localStorage for offline use
        if (typeof window !== "undefined" && menuData) {
          localStorage.setItem(
            `menuCache_${menu_id}`,
            JSON.stringify(menuData)
          );
        }
      }
      return menuData;
    },
    enabled: !!menu_id,
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
  const [formData, setFormData] = useState({
    itemcode: "",
    dish_name: "",
    category: "",
    price: "",
    description: "",
    stock_status: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState("");
  type Ingredient = {
    id: string;
    name: string;
    quantity: string;
    measurements: string;
  };
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "", name: "", quantity: "", measurements: "" },
  ]);
  const [showRemoveIngredientModal, setShowRemoveIngredientModal] =
    useState(false);
  const [ingredientToRemoveIdx, setIngredientToRemoveIdx] = useState<
    number | null
  >(null);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Collapsible sections state
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [showIngredients, setShowIngredients] = useState(true);

  useEffect(() => {
    if (menu) {
      setFormData({
        itemcode: menu.itemcode || "",
        dish_name: menu.dish_name,
        category: menu.category,
        price: menu.price.toString(),
        description: menu.description || "",
        stock_status: menu.stock_status || "",
      });
      setPreviewUrl(menu.image_url || null);
      setIngredients(
        menu.ingredients && menu.ingredients.length > 0
          ? menu.ingredients.map((ing: any) => ({
              id: ing.ingredient_id,
              name: ing.ingredient_name || ing.name || "",
              quantity: ing.quantity || "",
              measurements: ing.measurements || "",
            }))
          : [{ id: "", name: "", quantity: "", measurements: "" }]
      );
      setInitialSettings({
        dish_name: menu.dish_name,
        category: menu.category,
        price: menu.price.toString(),
        description: menu.description || "",
        stock_status: menu.stock_status || "",
        ingredients: menu.ingredients?.map((ing: any) => ({
          id: ing.ingredient_id,
          name: ing.ingredient_name || ing.name || "",
          quantity: ing.quantity || "",
          measurements: ing.measurements || "",
        })),
      });
    }
  }, [menu]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      setIsDirty(true);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleFocus = (fieldName: string) => setFocusedField(fieldName);
  const handleBlur = () => setFocusedField("");

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
    setIsDirty(true);
  };
  const addIngredient = () =>
    setIngredients([
      ...ingredients,
      { id: "", name: "", quantity: "", measurements: "" },
    ]);

  const removeIngredient = (idx: number) => {
    setIngredientToRemoveIdx(idx);
    setShowRemoveIngredientModal(true);
  };

  const confirmRemoveIngredient = async () => {
    if (ingredientToRemoveIdx !== null) {
      const ingredient = ingredients[ingredientToRemoveIdx];
      try {
        // Only call API if menu_id and ingredient have a name
        if (menu_id && ingredient.id) {
          await deleteIngredientFromMenu(menu_id, ingredient.id);
        }
        setIngredients((ings) =>
          ings.filter((_, i) => i !== ingredientToRemoveIdx)
        );
      } catch (err) {
        setError("Failed to remove ingredient from menu.");
      }
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
    setIsSubmitted(true);
    setIsSubmitting(true);

    if (!formData.dish_name.trim() || !formData.category || !formData.price) {
      setError("Please fill all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedImage) {
        const form = new FormData();
        form.append("itemcode", formData.itemcode);
        form.append("dish_name", formData.dish_name);
        form.append("category", formData.category);
        form.append("price", formData.price);
        form.append("description", formData.description);
        form.append("stock_status", formData.stock_status);
        form.append("ingredients", JSON.stringify(ingredients));
        form.append("file", selectedImage);

        await updateMenuWithImageAndIngredients(menu_id, form);
      } else {
        await updateMenu(menu_id, {
          itemcode: formData.itemcode,
          dish_name: formData.dish_name,
          category: formData.category,
          price: Number(formData.price),
          description: formData.description,
          stock_status: formData.stock_status,
          ingredients: ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity,
            measurements: ing.measurements || "",
          })),
        });
      }

      setIsDirty(false);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.push(routes.menu);
      }, 2000);
    } catch {
      setError("There was an error while updating the menu item.");
      setIsSubmitting(false);
    }
  };

  const handleSaveClick = () => {
    if (isDirty) setShowSaveModal(true);
    else router.push(routes.menu);
  };

  const handleConfirmSave = () => {
    setShowSaveModal(false);
    handleSubmit(new Event("submit") as unknown as React.FormEvent);
  };

  const handleCancel = () => {
    if (isDirty) setShowCancelModal(true);
    else router.push(routes.menu);
  };

  const handleConfirmCancel = (confirm: boolean) => {
    if (confirm) router.push(routes.menu);
    setShowCancelModal(false);
  };

  const isSettingsChanged = () => {
    if (!initialSettings) return false;
    return (
      initialSettings.dish_name !== formData.dish_name ||
      initialSettings.category !== formData.category ||
      initialSettings.price !== formData.price ||
      initialSettings.description !== formData.description ||
      JSON.stringify(initialSettings.ingredients) !==
        JSON.stringify(ingredients)
    );
  };

  const handleSidebarNavigate = (path: string) => {
    if (isSettingsChanged()) {
      setShowUnsavedModal(true);
      setPendingRoute(path);
      return;
    }
    router.push(path);
  };

  return (
    <section className="text-white font-poppins w-full min-h-screen">
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showUnsavedModal={showUnsavedModal}
        showCancelModal={showCancelModal}
        showSaveModal={showSaveModal}
        showRemoveIngredientModal={showRemoveIngredientModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Edit Menu main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              {/* OFFLINE WARNING BANNER */}
              {!isOnline && (
                <div className="mb-6 p-4 bg-yellow-900/80 border border-yellow-500/40 rounded-xl text-yellow-300 text-center font-semibold">
                  <MdCancel className="inline mr-2 text-yellow-400 text-lg align-text-bottom" />
                  You are offline. <b>Editing, adding, or removing</b> menu
                  items is <b>disabled</b> while offline. Please reconnect to
                  make changes.
                </div>
              )}
              <div className="flex flex-row items-center justify-center gap-4 mb-6 w-full">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full">
                    <MdEdit className="text-black text-2xl md:text-3xl lg:text-4xl" />
                  </div>
                </div>
                <div className="flex flex-col justify-center w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins text-left w-full">
                    Edit Menu Item
                  </h2>
                  <p className="text-gray-400 text-base mt-1 text-left w-full">
                    Update dish details, price, and ingredients
                  </p>
                </div>
              </div>

              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/70 text-xs xs:text-sm">
                    Menu Details
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-xs font-medium mb-1">
                        Basic Info
                      </p>
                      <p className="text-white text-xl font-bold">
                        {
                          [
                            formData.itemcode,
                            formData.dish_name,
                            formData.category,
                            formData.price,
                          ].filter(Boolean).length
                        }
                        /4
                      </p>
                    </div>
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <svg
                        className="w-5 h-5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-sm rounded-xl p-4 border border-green-500/30 hover:border-green-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-xs font-medium mb-1">
                        Ingredients
                      </p>
                      <p className="text-white text-xl font-bold">
                        {
                          ingredients.filter((ing) => ing.name && ing.quantity)
                            .length
                        }
                      </p>
                    </div>
                    <div className="bg-green-500/20 p-3 rounded-lg">
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-xs font-medium mb-1">
                        Image
                      </p>
                      <p className="text-white text-xl font-bold">
                        {selectedImage || previewUrl ? "✓" : "—"}
                      </p>
                    </div>
                    <div className="bg-purple-500/20 p-3 rounded-lg">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg">
                      <span className="text-black font-bold text-sm">1</span>
                    </div>
                    <span className="text-xs text-yellow-400 font-medium mt-2">
                      Basic Info
                    </span>
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ingredients.some((ing) => ing.name && ing.quantity)
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-400"
                        : "bg-gradient-to-r from-yellow-400 to-gray-600"
                    }`}
                  ></div>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                        ingredients.some((ing) => ing.name && ing.quantity)
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-500"
                          : "bg-gray-700 border-2 border-gray-600"
                      }`}
                    >
                      <span
                        className={`font-bold text-sm ${
                          ingredients.some((ing) => ing.name && ing.quantity)
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      >
                        2
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium mt-2 ${
                        ingredients.some((ing) => ing.name && ing.quantity)
                          ? "text-yellow-400"
                          : "text-gray-500"
                      }`}
                    >
                      Ingredients
                    </span>
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      selectedImage || previewUrl
                        ? "bg-yellow-400"
                        : "bg-gray-600"
                    }`}
                  ></div>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                        selectedImage || previewUrl
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-500"
                          : "bg-gray-700 border-2 border-gray-600"
                      }`}
                    >
                      <span
                        className={`font-bold text-sm ${
                          selectedImage || previewUrl
                            ? "text-black"
                            : "text-gray-400"
                        }`}
                      >
                        3
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium mt-2 ${
                        selectedImage || previewUrl
                          ? "text-yellow-400"
                          : "text-gray-500"
                      }`}
                    >
                      Image
                    </span>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8"
              >
                {/* Disable all fields and buttons if offline */}
                <fieldset
                  disabled={!isOnline}
                  style={
                    !isOnline ? { opacity: 0.6, pointerEvents: "none" } : {}
                  }
                >
                  {/* Basic Information Section */}
                  <section className="mb-6">
                    {/* Collapsible Header */}
                    <button
                      type="button"
                      onClick={() => setShowBasicInfo(!showBasicInfo)}
                      className="w-full flex items-center justify-between bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300 mb-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 p-2.5 rounded-lg">
                          <svg
                            className="w-5 h-5 text-yellow-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h2 className="text-lg font-bold text-yellow-300">
                            Basic Information
                          </h2>
                          <p className="text-xs text-gray-400">
                            Item code, name, category, and pricing
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                          showBasicInfo ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Collapsible Content */}
                    {showBasicInfo && (
                      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                          <div className="space-y-4">
                            <div className="group">
                              <label
                                htmlFor="itemcode"
                                className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                              >
                                Item Code
                              </label>
                              <input
                                type="text"
                                id="itemcode"
                                name="itemcode"
                                value={formData.itemcode}
                                onChange={handleChange}
                                onFocus={() => handleFocus("itemcode")}
                                onBlur={handleBlur}
                                className="w-full bg-gray-700 text-gray-400 rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base border-gray-600/50 cursor-not-allowed"
                              />
                            </div>
                            {/* Dish Name */}
                            <div className="group">
                              <label
                                htmlFor="dish_name"
                                className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                              >
                                <FiTag className="text-yellow-400" />
                                Dish Name
                                <span className="text-red-400">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  id="dish_name"
                                  name="dish_name"
                                  required
                                  value={formData.dish_name}
                                  onChange={handleChange}
                                  onFocus={() => handleFocus("dish_name")}
                                  onBlur={handleBlur}
                                  placeholder="Enter dish name..."
                                  className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-lg xs:rounded-xl px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-3 md:py-4 border-2 text-xs xs:text-sm sm:text-base transition-all duration-300 placeholder-gray-500 ${
                                    isSubmitted && !formData.dish_name
                                      ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                                      : focusedField === "dish_name"
                                      ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                                      : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                                  }`}
                                  disabled={!isOnline}
                                />
                                {focusedField === "dish_name" && (
                                  <div className="absolute right-2 xs:right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Category */}
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
                                  value={formData.category}
                                  onChange={handleChange}
                                  onFocus={() => handleFocus("category")}
                                  onBlur={handleBlur}
                                  className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 cursor-pointer ${
                                    isSubmitted && !formData.category
                                      ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                                      : focusedField === "category"
                                      ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                                      : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                                  }`}
                                  disabled={!isOnline}
                                >
                                  <option value="" className="bg-gray-800">
                                    Select Category...
                                  </option>
                                  {CATEGORY_OPTIONS.map((cat) => (
                                    <option
                                      key={cat}
                                      value={cat}
                                      className="bg-gray-800"
                                    >
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                                {focusedField === "category" && (
                                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="group">
                              <label
                                htmlFor="price"
                                className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                              >
                                <FiHash className="text-yellow-400" />
                                Price (₱)
                                <span className="text-red-400">*</span>
                              </label>
                              <div className="relative max-w-md">
                                <input
                                  type="number"
                                  id="price"
                                  name="price"
                                  required
                                  min={0}
                                  step="0.01"
                                  value={formData.price}
                                  onChange={handleChange}
                                  onFocus={() => handleFocus("price")}
                                  onBlur={handleBlur}
                                  placeholder="Enter price..."
                                  className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 placeholder-gray-500 ${
                                    isSubmitted && !formData.price
                                      ? "border-red-500/70 focus:border-red-400 bg-red-500/5"
                                      : focusedField === "price"
                                      ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                                      : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                                  }`}
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  disabled={!isOnline}
                                />
                                {focusedField === "price" && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <div className="group">
                              <label
                                htmlFor="description"
                                className="flex items-center gap-2 text-gray-300 mb-3 font-medium text-sm sm:text-base transition-colors group-focus-within:text-yellow-400"
                              >
                                <FiTag className="text-yellow-400" />
                                Description
                              </label>
                              <div className="relative">
                                <textarea
                                  id="description"
                                  name="description"
                                  value={formData.description}
                                  onChange={handleChange}
                                  onFocus={() => handleFocus("description")}
                                  onBlur={handleBlur}
                                  placeholder="Enter dish description..."
                                  className={`w-full bg-gray-800/50 backdrop-blur-sm text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 border-2 text-sm sm:text-base transition-all duration-300 placeholder-gray-500 resize-vertical min-h-[80px] ${
                                    focusedField === "description"
                                      ? "border-yellow-400/70 focus:border-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
                                      : "border-gray-600/50 hover:border-gray-500 focus:border-yellow-400/70"
                                  }`}
                                  rows={3}
                                  disabled={!isOnline}
                                />
                                {focusedField === "description" && (
                                  <div className="absolute right-3 top-3">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Image Preview & Upload */}
                          <div className="flex flex-col items-center justify-center w-full gap-2">
                            <label className="flex items-center gap-2 text-gray-300 mb-2 font-medium text-sm sm:text-base">
                              <FiImage className="text-yellow-400" />
                              Dish Image
                            </label>
                            {previewUrl ? (
                              <div className="relative w-32 h-32 xs:w-44 xs:h-44 md:w-44 md:h-52 border-2 border-dashed border-yellow-400 bg-gray-900 rounded-lg flex items-center justify-center">
                                <Image
                                  src={previewUrl}
                                  alt="Selected"
                                  width={208}
                                  height={208}
                                  className="w-full h-full object-contain rounded-lg shadow-xl"
                                  style={{ objectFit: "contain" }}
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <span className="text-gray-500">No Image</span>
                            )}
                            <label
                              className={`mt-4 bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-0.5 rounded-lg font-semibold shadow cursor-pointer transition ${
                                !isOnline
                                  ? "opacity-50 pointer-events-none"
                                  : ""
                              }`}
                            >
                              Change Image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                disabled={!isOnline}
                              />
                            </label>
                            <span className="text-xs text-gray-400 mt-1">
                              Choose a new image to update.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Ingredients Section */}
                  <section className="mb-6">
                    {/* Collapsible Header */}
                    <button
                      type="button"
                      onClick={() => setShowIngredients(!showIngredients)}
                      className="w-full flex items-center justify-between bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300 mb-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-green-400/20 to-green-500/20 p-2.5 rounded-lg">
                          <svg
                            className="w-5 h-5 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h2 className="text-lg font-bold text-green-300">
                            Ingredients
                          </h2>
                          <p className="text-xs text-gray-400">
                            {
                              ingredients.filter(
                                (ing) => ing.name && ing.quantity
                              ).length
                            }{" "}
                            ingredient
                            {ingredients.filter(
                              (ing) => ing.name && ing.quantity
                            ).length !== 1
                              ? "s"
                              : ""}{" "}
                            added
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                          showIngredients ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Collapsible Content */}
                    {showIngredients && (
                      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-xl animate-fade-in">
                        <div className="space-y-3">
                          {ingredients.map((ing, idx) => (
                            <div
                              key={idx}
                              className="group grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/30 hover:border-green-400/30 hover:shadow-lg hover:shadow-green-400/10 transition-all duration-300"
                            >
                              {/* Ingredient Number Badge */}
                              <div className="hidden sm:block sm:col-span-12 mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="bg-gradient-to-br from-green-400/20 to-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                                    <span className="text-green-400 text-xs font-bold">
                                      #{idx + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 h-px bg-gradient-to-r from-green-400/20 to-transparent"></div>
                                </div>
                              </div>
                              {/* Ingredient Name */}
                              <div className="sm:col-span-5">
                                <label className="block mb-2 text-sm font-medium text-yellow-300">
                                  Ingredient Name *
                                </label>
                                <select
                                  value={ing.name}
                                  onChange={(e) =>
                                    handleIngredientChange(
                                      idx,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 hover:border-yellow-400/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition"
                                  disabled={itemNamesLoading || !isOnline}
                                >
                                  <option value="">Select Ingredient</option>
                                  {items
                                    .filter((item) => {
                                      const measurement =
                                        item.measurement?.toLowerCase() || "";
                                      const category =
                                        item.category?.toLowerCase() || "";

                                      // Filter out items with gallon/liter measurements
                                      if (["l", "gal"].includes(measurement)) {
                                        return false;
                                      }

                                      // Filter out items with "pack" measurement, except for Meats and Seafood
                                      if (measurement === "pack") {
                                        const allowedCategories = [
                                          "meats",
                                          "seafood",
                                        ];
                                        if (
                                          !allowedCategories.includes(category)
                                        ) {
                                          return false;
                                        }
                                      }

                                      // If menu category is "Drinks", only show "Beverage" items
                                      if (formData.category === "Drinks") {
                                        return category === "beverage";
                                      }

                                      // If menu category is NOT "Drinks", exclude "Beverage" items
                                      if (
                                        formData.category !== "Drinks" &&
                                        category === "beverage"
                                      ) {
                                        return false;
                                      }

                                      return true;
                                    })
                                    .map((item) => (
                                      <option
                                        key={item.item_name}
                                        value={item.item_name}
                                      >
                                        {item.item_name}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              {/* Quantity */}
                              <div className="sm:col-span-3">
                                <label className="block mb-2 text-sm font-medium text-yellow-300">
                                  Quantity *
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={999}
                                  step={1}
                                  placeholder="0"
                                  value={ing.quantity}
                                  onChange={(e) =>
                                    handleIngredientChange(
                                      idx,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 hover:border-yellow-400/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                />
                              </div>

                              {/* Unit */}
                              <div className="sm:col-span-3">
                                <label className="block mb-2 text-sm font-medium text-yellow-300">
                                  Unit *
                                </label>
                                <select
                                  value={ing.measurements || ""}
                                  onChange={(e) =>
                                    handleIngredientChange(
                                      idx,
                                      "measurements",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 hover:border-yellow-400/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition"
                                >
                                  <option value="" disabled>
                                    Select unit
                                  </option>
                                  {(() => {
                                    const selectedItem = items.find(
                                      (item) => item.item_name === ing.name
                                    );
                                    const category =
                                      selectedItem?.category || "";
                                    const availableUnits =
                                      getUnitsForCategory(category);

                                    return availableUnits.map((unit) => (
                                      <option
                                        key={unit.value}
                                        value={unit.value}
                                      >
                                        {unit.label}
                                      </option>
                                    ));
                                  })()}
                                </select>
                              </div>

                              {/* Remove Button */}
                              <div className="sm:col-span-1 flex items-end">
                                <button
                                  type="button"
                                  onClick={() => removeIngredient(idx)}
                                  className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                                  aria-label="Remove ingredient"
                                  disabled={!isOnline || ingredients.length < 1}
                                >
                                  <FaTrash className="w-4 h-4" />
                                  <span className="sm:hidden">Remove</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={addIngredient}
                          className="group mt-4 w-full sm:w-auto bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-black px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-400/50 transition-all duration-300 flex items-center justify-center gap-2"
                          disabled={!isOnline}
                        >
                          <svg
                            className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>Add Ingredient</span>
                        </button>

                        <p className="text-gray-400 text-xs mt-4 flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">💡</span>
                          <span>
                            Tip: Add all ingredients with their amounts. You can
                            remove or edit any ingredient before saving.
                          </span>
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {/* Action Buttons */}
                  <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 md:gap-4 pt-4 xs:pt-5 sm:pt-6 md:pt-8 border-t border-gray-700/50">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="group flex items-center justify-center gap-1.5 xs:gap-2 px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-medium xs:font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto order-2 xs:order-1"
                      style={{ minWidth: 0 }}
                      disabled={!isOnline}
                    >
                      <MdCancel className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-300" />
                      <span className="hidden xs:inline">Cancel</span>
                      <span className="xs:hidden">Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveClick}
                      disabled={isSubmitting || !isOnline}
                      className="group flex items-center justify-center gap-1.5 xs:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl font-medium xs:font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs xs:text-sm sm:text-base w-full xs:w-auto shadow-lg hover:shadow-yellow-400/25 order-1 xs:order-2"
                      style={{ minWidth: 0 }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          <span className="hidden xs:inline">Updating...</span>
                          <span className="xs:hidden">Update</span>
                        </>
                      ) : (
                        <>
                          <MdSave className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                          <span className="hidden sm:inline">Update Item</span>
                          <span className="sm:hidden">Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </fieldset>
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
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 space-y-4 sm:space-y-6 max-w-sm sm:max-w-lg w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 mb-4 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center">
                  <FiSave className="w-8 h-8 text-yellow-400" />
                </div>
                <h3
                  id="save-dialog-title"
                  className="text-xl sm:text-2xl font-bold text-white mb-2"
                >
                  Confirm Update
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">
                  Review the changes before saving
                </p>
              </div>

              {/* Menu Item Being Updated */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <MdEdit className="text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-300">Menu Item:</span>
                  <span className="text-sm font-bold text-white">{formData.dish_name}</span>
                </div>

                {/* Changes Summary */}
                <div className="space-y-2">
                  {initialSettings && (
                    <>
                      {formData.category !== initialSettings.category && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiPackage className="text-purple-400 flex-shrink-0" />
                          <span className="text-gray-400">Category:</span>
                          <span className="text-red-400 line-through">{initialSettings.category}</span>
                          <FiArrowRight className="text-gray-500" />
                          <span className="text-green-400">{formData.category}</span>
                        </div>
                      )}
                      {formData.price !== initialSettings.price && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiTag className="text-green-400 flex-shrink-0" />
                          <span className="text-gray-400">Price:</span>
                          <span className="text-red-400 line-through">₱{initialSettings.price}</span>
                          <FiArrowRight className="text-gray-500" />
                          <span className="text-green-400">₱{formData.price}</span>
                        </div>
                      )}
                      {formData.stock_status !== initialSettings.stock_status && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiAlertCircle className="text-blue-400 flex-shrink-0" />
                          <span className="text-gray-400">Status:</span>
                          <span className="text-red-400 line-through">{initialSettings.stock_status}</span>
                          <FiArrowRight className="text-gray-500" />
                          <span className="text-green-400">{formData.stock_status}</span>
                        </div>
                      )}
                      {formData.description !== initialSettings.description && (
                        <div className="flex items-start gap-2 text-xs sm:text-sm">
                          <FiFileText className="text-orange-400 flex-shrink-0 mt-1" />
                          <span className="text-gray-400">Description:</span>
                          <span className="text-green-400 flex-1">Updated</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Cancel
                </button>
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
                  onClick={() => setShowUnsavedModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 text-sm sm:text-base order-2 sm:order-1 cursor-pointer"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsavedModal(false);
                    if (pendingRoute) router.push(pendingRoute);
                  }}
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

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="w-5 xs:w-6 h-5 xs:h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiCheck className="w-3 xs:w-4 h-3 xs:h-4 text-white" />
              </div>
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                Menu updated successfully!
              </span>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
