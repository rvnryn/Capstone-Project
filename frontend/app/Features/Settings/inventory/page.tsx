// Utility to capitalize the first letter of each word
"use client";
import { useRouter } from "next/navigation";
import { FaTrash, FaWarehouse } from "react-icons/fa";
import { useEffect, useState } from "react";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import {
  InventorySetting,
  InventorySettingInput,
  useInventorySettings,
  useDeleteInventorySetting,
  useBatchUpdateInventorySettings,
} from "./hooks/use-inventorySettingsQuery";
import { routes } from "@/app/routes/routes";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { MdCancel, MdSave, MdWarning } from "react-icons/md";
import { FiAlertTriangle, FiSave } from "react-icons/fi";
import { useInventoryItemNames } from "@/app/hooks/Itemnames";
import {
  INVENTORY_UNIT_OPTIONS,
  getUnitsForCategory,
} from "@/app/constants/unitOptions";

export default function InventorySettings() {
  // --- Offline/Cache State ---
  const [isOnline, setIsOnline] = useState(true);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const cacheKey = "inventory_settings_cache";
  const router = useRouter();

  // React Query hooks
  const {
    data: settingsData = [],
    isLoading,
    error: queryError,
  } = useInventorySettings();
  const deleteMutation = useDeleteInventorySetting();
  const batchUpdateMutation = useBatchUpdateInventorySettings();

  const [ingredients, setIngredients] = useState<InventorySetting[]>([]);
  const [pendingIngredients, setPendingIngredients] = useState<
    InventorySetting[]
  >([]);
  const [initialSettings, setInitialSettings] = useState<InventorySetting[]>(
    []
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState<InventorySettingInput>({
    name: "",
    default_unit: "",
    low_stock_threshold: 1,
    category: "",
  });
  const [addError, setAddError] = useState("");
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] =
    useState<InventorySetting | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Collapsible section states
  const [showAddForm, setShowAddForm] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  const { items, loading: itemNamesLoading } = useInventoryItemNames();
  const uniqueCategories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  );
  const selectedItem = items.find(
    (item) => item.item_name === newIngredient.name
  );
  const selectedCategory = selectedItem?.category || "";

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync React Query data with local state
  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      setIngredients(settingsData);
      setPendingIngredients(settingsData);
      setInitialSettings(settingsData);
      setOfflineError(null);
    } else if (!isOnline && typeof window !== "undefined") {
      // Try to load from cache when offline
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setIngredients(data);
          setPendingIngredients(data);
          setInitialSettings(data);
          setOfflineError(null);
        } catch {
          setOfflineError(
            "You are offline and no cached inventory data is available. Please connect to the internet to view or edit inventory settings."
          );
        }
      } else {
        setOfflineError(
          "You are offline and no cached inventory data is available. Please connect to the internet to view or edit inventory settings."
        );
      }
    }
  }, [settingsData, isOnline]);
  const handleUnitChange = (id: number, value: string) => {
    setPendingIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, default_unit: value } : i))
    );
  };
  const handleThresholdChange = (id: number, value: number) => {
    setPendingIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, low_stock_threshold: value } : i))
    );
  };
  const handleCategoryChange = (id: number, value: string) => {
    setPendingIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, category: value } : i))
    );
  };
  const handleDeleteIngredient = async (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        // Remove from both pending and initial state
        setPendingIngredients((prev) => prev.filter((i) => i.id !== id));
        setIngredients((prev) => prev.filter((i) => i.id !== id));
        setInitialSettings((prev) => prev.filter((i) => i.id !== id));

        setSaveMessage("Ingredient deleted successfully!");
        setTimeout(() => setSaveMessage(""), 2000);
      },
    });
  };
  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    const name = newIngredient.name.trim();
    const default_unit = newIngredient.default_unit?.trim() || "";
    const low_stock_threshold = newIngredient.low_stock_threshold || 1;
    const category = newIngredient.category || "";
    if (!name || !default_unit) {
      setAddError("Both name and default unit are required.");
      return;
    }
    if (
      ingredients.some(
        (ing) => ing.name.toLowerCase() === name.toLowerCase()
      ) ||
      pendingIngredients.some(
        (ing) => ing.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setAddError("Ingredient already exists.");
      return;
    }
    const newId = Math.max(0, ...pendingIngredients.map((i) => i.id)) + 1;
    setPendingIngredients((prev) => [...prev, { id: newId, ...newIngredient }]);
    setNewIngredient({
      name: "",
      default_unit: "",
      low_stock_threshold: 1,
      category: "",
    });

    // Show success message
    setSaveMessage("Ingredient added! Click Save to confirm changes.");
    setTimeout(() => setSaveMessage(""), 3000);
  };
  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());
  // Save all changes using batch mutation
  const handleConfirmSave = async () => {
    setShowSaveModal(false);

    // Find added, updated, deleted
    const added = pendingIngredients.filter(
      (i) => !initialSettings.some((orig) => orig.id === i.id)
    );
    const updated = pendingIngredients.filter((i) =>
      initialSettings.some(
        (orig) =>
          orig.id === i.id &&
          (orig.name !== i.name ||
            orig.default_unit !== i.default_unit ||
            orig.low_stock_threshold !== i.low_stock_threshold ||
            orig.category !== i.category)
      )
    );
    const deleted = initialSettings.filter(
      (orig) => !pendingIngredients.some((i) => i.id === orig.id)
    );

    // Use batch mutation
    batchUpdateMutation.mutate(
      { added, updated, deleted },
      {
        onSuccess: () => {
          setSaveMessage("Settings saved successfully!");
          setTimeout(() => setSaveMessage(""), 2000);
          setInitialSettings(pendingIngredients);
          setIngredients(pendingIngredients);
          router.push(routes.settings);
        },
        onError: () => {
          setSaveMessage("Failed to save some settings.");
          setTimeout(() => setSaveMessage(""), 3000);
        },
      }
    );
  };

  const handleCancel = () => setShowCancelModal(true);
  const handleSave = () => setShowSaveModal(true);
  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    setNewIngredient({
      name: "",
      default_unit: "",
      low_stock_threshold: 1,
      category: "",
    });
    setAddError("");
    router.push(routes.settings);
  };

  // Filter logic
  const filteredIngredients = pendingIngredients.filter((ingredient) => {
    // Search filter - matches name
    const matchesSearch = ingredient.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      categoryFilter === "all" || ingredient.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  // Get unique categories from pendingIngredients
  const availableCategories = Array.from(
    new Set(pendingIngredients.map((i) => i.category).filter(Boolean))
  ).sort();

  const isSettingsChanged = () => {
    if (!initialSettings) return false;
    // Deep compare the ingredients array
    return (
      JSON.stringify(initialSettings) !== JSON.stringify(pendingIngredients)
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
      <section className="text-white font-poppins w-full min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <NavigationBar onNavigate={handleSidebarNavigate} />
        <ResponsiveMain>
          <main className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center justify-center p-12 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl">
              <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mb-6"></div>
              <p className="text-gray-300 font-medium text-lg">
                Loading inventory settings...
              </p>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  if (offlineError) {
    return (
      <section className="text-white font-poppins w-full min-h-screen">
        <NavigationBar onNavigate={handleSidebarNavigate} />
        <ResponsiveMain>
          <main className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="text-red-400 font-bold text-lg">
                {offlineError}
              </div>
              <button
                className="mt-4 px-6 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </main>
        </ResponsiveMain>
      </section>
    );
  }

  return (
    <section className="text-white font-poppins">
      <NavigationBar
        onNavigate={handleSidebarNavigate}
        showSaveModal={showSaveModal}
        showCancelModal={showCancelModal}
        showUnsavedModal={showUnsavedModal}
        showDeleteModal={showDeleteModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Inventory Settings main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            <article className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full">
              <header className="flex flex-col space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                      <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 p-1.5 xs:p-2 sm:p-3 rounded-full">
                        <FaWarehouse className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                        Inventory Settings
                      </h1>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                        Manage your ingredient units, categories, and thresholds
                      </p>
                    </div>
                  </div>
                  <nav
                    aria-label="Inventory settings actions"
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start"
                  >
                    <button
                      type="button"
                      onClick={handleSave}
                      className="group flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base w-full sm:w-auto shadow-lg hover:shadow-yellow-400/25 order-1"
                    >
                      <MdSave className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="hidden sm:inline">Save</span>
                      <span className="sm:hidden">Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="group flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border-2 border-gray-500/50 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-700/30 font-semibold transition-all duration-300 cursor-pointer text-sm sm:text-base w-full sm:w-auto order-2"
                    >
                      <MdCancel className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-300" />
                      <span className="hidden sm:inline">Cancel</span>
                      <span className="sm:hidden">Cancel</span>
                    </button>
                  </nav>
                </div>
              </header>
              <div className="relative mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-2 xs:px-3 sm:px-4 text-yellow-400/70 text-xs xs:text-sm">
                    Inventory Management Settings
                  </span>
                </div>
              </div>
              <section className="mb-6 sm:mb-8" aria-label="Add ingredient">
                {/* Collapsible Header */}
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300 mb-3 group"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-yellow-300">
                        Add New Ingredient
                      </h2>
                      <p className="text-xs text-gray-400">
                        Configure units, thresholds, and categories
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                      showAddForm ? "rotate-180" : ""
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
                {showAddForm && (
                  <form
                    onSubmit={handleAddIngredient}
                    className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-xl animate-fade-in"
                    role="form"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                      {/* Ingredient Name */}
                      <div className="lg:col-span-2 relative">
                        <label
                          htmlFor="ingredient-name"
                          className="block mb-2 text-sm font-medium text-yellow-300"
                        >
                          Ingredient Name *
                        </label>
                        <select
                          id="ingredient-name"
                          value={newIngredient.name}
                          onChange={(e) => {
                            const selectedName = e.target.value;
                            const selectedItem = items.find(
                              (item) => item.item_name === selectedName
                            );
                            setNewIngredient((ni: InventorySettingInput) => ({
                              ...ni,
                              name: selectedName,
                              category: selectedItem?.category || "",
                            }));
                          }}
                          className="w-full h-12 bg-gray-800/80 text-white rounded-xl px-4 py-3 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500"
                          disabled={itemNamesLoading}
                          required
                        >
                          <option value="">Select Ingredient</option>
                          {items
                            .filter(
                              (item) =>
                                !pendingIngredients.some(
                                  (ing) =>
                                    ing.name.toLowerCase() ===
                                    item.item_name.toLowerCase()
                                )
                            )
                            .map((item) => (
                              <option
                                key={item.item_name}
                                value={item.item_name}
                              >
                                {item.item_name}
                              </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 top-7 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
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
                        </div>
                      </div>

                      {/* Threshold */}
                      <div>
                        <label
                          htmlFor="threshold"
                          className="block mb-2 text-sm font-medium text-yellow-300"
                        >
                          Low Stock Alert
                        </label>
                        <input
                          type="number"
                          id="threshold"
                          min="0"
                          step="0.1"
                          placeholder="Alert threshold"
                          value={
                            newIngredient.low_stock_threshold === 0
                              ? ""
                              : newIngredient.low_stock_threshold
                          }
                          onChange={(e) =>
                            setNewIngredient((ni: InventorySettingInput) => ({
                              ...ni,
                              low_stock_threshold: Number(e.target.value) || 0,
                            }))
                          }
                          className="w-full h-12 bg-gray-800/80 text-white rounded-xl px-4 py-3 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm placeholder-gray-400 transition-all duration-200 hover:border-gray-500"
                          autoComplete="off"
                        />
                      </div>

                      {/* Default Unit */}
                      <div className="relative">
                        <label
                          htmlFor="default-unit"
                          className="block mb-2 text-sm font-medium text-yellow-300"
                        >
                          Unit *
                        </label>
                        <select
                          id="default-unit"
                          value={newIngredient.default_unit}
                          onChange={(e) =>
                            setNewIngredient((ni: InventorySettingInput) => ({
                              ...ni,
                              default_unit: e.target.value,
                            }))
                          }
                          className="w-full h-12 bg-gray-800/80 text-white rounded-xl px-4 py-3 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500"
                          required
                        >
                          <option value="" disabled>
                            Select unit
                          </option>
                          {getUnitsForCategory(
                            newIngredient.category || ""
                          ).map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="absolute inset-y-0 top-7 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
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
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <label
                          htmlFor="category"
                          className="block mb-2 text-sm font-medium text-yellow-300"
                        >
                          Category
                        </label>
                        <input
                          type="text"
                          value={newIngredient.category}
                          readOnly
                          className="w-full h-12 bg-gray-800/80 text-white rounded-xl px-4 py-3 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500"
                        />
                      </div>

                      {/* Add Button */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                        >
                          <svg
                            className="w-4 h-4"
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
                          Add Ingredient
                        </button>
                        {addError &&
                          (() => {
                            const AutoClearError: React.FC<{
                              message: string;
                            }> = ({ message }) => {
                              const [visible, setVisible] = useState(true);
                              useEffect(() => {
                                setVisible(true);
                                const t = setTimeout(
                                  () => setVisible(false),
                                  2000
                                );
                                return () => clearTimeout(t);
                              }, [message]);
                              useEffect(() => {
                                if (!visible) setAddError("");
                              }, [visible]);
                              if (!visible) return null;
                              return (
                                <div className="mt-2 text-red-400 text-sm font-semibold">
                                  {message}
                                </div>
                              );
                            };
                            return <AutoClearError message={addError} />;
                          })()}
                      </div>
                    </div>

                    {/* Helper text */}
                    <div className="mt-4 text-xs text-gray-400">
                      <span className="text-yellow-400">*</span> Required fields
                    </div>
                  </form>
                )}
              </section>

              {/* Filter Section */}
              <section className="mb-6" aria-label="Filter ingredients">
                {/* Collapsible Header */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300 mb-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-400/20 to-blue-500/20 p-2.5 rounded-lg">
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
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-blue-300">
                        Search & Filter
                      </h2>
                      <p className="text-xs text-gray-400">
                        {filteredIngredients.length} of{" "}
                        {pendingIngredients.length} ingredient
                        {pendingIngredients.length !== 1 ? "s" : ""} shown
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                      showFilters ? "rotate-180" : ""
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
                {showFilters && (
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-xl animate-fade-in">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                      {/* Search Filter */}
                      <div className="flex-1 w-full">
                        <label
                          htmlFor="search-ingredient"
                          className="block mb-2 text-sm font-medium text-yellow-300"
                        >
                          Search Ingredient
                        </label>
                        <div className="relative">
                          <input
                            id="search-ingredient"
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 bg-gray-800/80 text-white rounded-xl pl-11 pr-4 py-3 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm transition-all duration-200 hover:border-gray-500"
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Category Filter */}
                      <div className="flex-1 w-full">
                        <label
                          htmlFor="category-filter"
                          className="block mb-2 text-sm font-medium text-yellow-300"
                        >
                          Filter by Category
                        </label>
                        <div className="relative">
                          <select
                            id="category-filter"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full h-12 bg-gray-800/80 text-white rounded-xl px-4 py-3 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500"
                          >
                            <option value="all">All Categories</option>
                            {availableCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
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
                          </div>
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      <div className="w-full lg:w-auto">
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          disabled={
                            searchQuery === "" && categoryFilter === "all"
                          }
                          className="w-full lg:w-auto h-12 px-6 bg-gray-700/50 hover:bg-gray-600/50 disabled:bg-gray-800/30 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 text-sm border border-gray-600 hover:border-gray-500 disabled:border-gray-700"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-gray-400">
                      Showing {filteredIngredients.length} of{" "}
                      {pendingIngredients.length} ingredient
                      {pendingIngredients.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </section>

              {/* Quick Stats */}
              <section className="mb-6">
                <div className="grid grid-cols-1 gap-4">
                  {/* Total Ingredients */}
                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-300 text-xs font-medium mb-1">
                          Total Ingredients
                        </p>
                        <p className="text-white text-2xl font-bold">
                          {pendingIngredients.length}
                        </p>
                      </div>
                      <div className="bg-purple-500/20 p-3 rounded-lg">
                        <svg
                          className="w-6 h-6 text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Ingredients Table Section */}
              <section>
                {/* Table Header */}
                <div className="flex items-center gap-3 mb-4 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-green-300">
                      Ingredients List
                    </h2>
                    <p className="text-xs text-gray-400">
                      Manage units, thresholds, and categories for each
                      ingredient
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl">
                  <table className="table-auto w-full text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-left border-collapse min-w-[700px]">
                    <caption className="sr-only">Ingredients Table</caption>
                    <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-yellow-300 whitespace-nowrap rounded-tl-xl">
                          Ingredient
                        </th>
                        <th className="px-4 py-3 text-left text-yellow-300 whitespace-nowrap">
                          Threshold
                        </th>
                        <th className="px-4 py-3 text-left text-yellow-300 whitespace-nowrap">
                          Default Unit
                        </th>
                        <th className="px-4 py-3 text-left text-yellow-300 whitespace-nowrap">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-yellow-300 whitespace-nowrap rounded-tr-xl">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-16 animate-fade-in"
                          >
                            <div className="flex flex-col items-center justify-center gap-4">
                              {pendingIngredients.length === 0 ? (
                                <>
                                  <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 p-6 rounded-full">
                                    <svg
                                      className="w-16 h-16 text-yellow-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <h3 className="text-xl font-bold text-yellow-300 mb-2">
                                      No Ingredients Yet
                                    </h3>
                                    <p className="text-gray-400 text-sm max-w-md">
                                      Get started by adding your first
                                      ingredient using the form above. Set up
                                      units, thresholds, and categories to
                                      manage your inventory effectively.
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="bg-gradient-to-br from-blue-400/20 to-blue-500/20 p-6 rounded-full">
                                    <svg
                                      className="w-16 h-16 text-blue-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <h3 className="text-xl font-bold text-blue-300 mb-2">
                                      No Matches Found
                                    </h3>
                                    <p className="text-gray-400 text-sm max-w-md">
                                      No ingredients match your current filters.
                                      Try adjusting your search query or
                                      category filter to see more results.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={handleClearFilters}
                                      className="mt-4 px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-medium transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50"
                                    >
                                      Clear All Filters
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredIngredients.map((ing, idx) => (
                          <tr
                            key={ing.id}
                            tabIndex={0}
                            aria-label={`Row for ${ing.name}`}
                            className={`group transition-all duration-200 ${
                              idx % 2 === 0
                                ? "bg-gray-900/80"
                                : "bg-gray-800/80"
                            } hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-transparent border-b border-gray-700/30 last:border-b-0 animate-fade-in`}
                          >
                            <td className="px-4 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 p-2 rounded-lg group-hover:from-yellow-400/30 group-hover:to-yellow-500/30 transition-all duration-200">
                                  <svg
                                    className="w-4 h-4 text-yellow-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                  </svg>
                                </div>
                                <span className="text-white font-medium">
                                  {ing.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <input
                                type="number"
                                min={1}
                                aria-label={`Threshold for ${ing.name}`}
                                value={
                                  ing.low_stock_threshold === 0
                                    ? ""
                                    : ing.low_stock_threshold
                                }
                                onChange={(e) =>
                                  handleThresholdChange(
                                    ing.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full h-12 bg-gray-800/80 text-white rounded-xl px-4 py-3 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500"
                              />
                            </td>
                            <td className="px-4 py-3 flex items-center gap-2 align-middle relative">
                              <select
                                aria-label={`Default unit for ${ing.name}`}
                                value={ing.default_unit}
                                onChange={(e) =>
                                  handleUnitChange(ing.id, e.target.value)
                                }
                                className="w-full h-12 bg-gray-800/80 text-white rounded-xl px-4 py-3 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none text-sm appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500"
                                required
                              >
                                <option value="" disabled>
                                  Select unit
                                </option>
                                {getUnitsForCategory(ing.category || "").map(
                                  (unit) => (
                                    <option key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </option>
                                  )
                                )}
                              </select>
                              {/* Custom dropdown arrow */}
                              <div className="absolute inset-y-0 right-7 flex items-center pointer-events-none">
                                <svg
                                  className="w-4 h-4 text-gray-400"
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
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle relative">
                              {ing.category && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  {ing.category}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <button
                                type="button"
                                aria-label={`Delete ${ing.name}`}
                                onClick={() => {
                                  setIngredientToDelete(ing);
                                  setShowDeleteModal(true);
                                }}
                                className="group/btn flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg font-semibold text-sm transition-all duration-200 border border-red-500/30 hover:border-red-400 shadow-sm"
                                title="Delete ingredient"
                              >
                                <FaTrash className="w-3 h-3 group-hover/btn:scale-110 transition-transform duration-200" />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </article>
          </div>
        </main>
        {saveMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 xs:gap-3">
              <span className="font-medium xs:font-semibold text-xs xs:text-sm sm:text-base leading-tight">
                {saveMessage}
              </span>
            </div>
          </div>
        )}

        {/* Save Confirmation Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-700/50">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center">
                <FiSave className="w-8 h-8 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                Save Confirmation
              </h2>
              <p className="text-gray-300">
                Are you sure you want to save the changes?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleConfirmSave}
                  className="px-8 py-3 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-8 py-3 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-700/50">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-full flex items-center justify-center">
                <MdCancel className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                Cancel Confirmation
              </h2>
              <p className="text-gray-300">Are you sure you want to cancel?</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleConfirmCancel}
                  className="px-8 py-3 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-8 py-3 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  No, Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Modal */}
        {showUnsavedModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border border-gray-700/50">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 font-poppins">
                Unsaved Changes
              </h2>
              <p className="text-gray-300">
                You have unsaved changes. Are you sure you want to leave without
                saving?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleConfirmUnsaved}
                  className="px-8 py-3 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  Leave Without Saving
                </button>
                <button
                  onClick={handleCancelUnsaved}
                  className="px-8 py-3 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-semibold transition-all cursor-pointer"
                >
                  Stay
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && ingredientToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl text-center space-y-8 max-w-md w-full border-2 border-gray-700/50">
              <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg xs:blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-2 xs:p-3 sm:p-4 rounded-full">
                    <MdWarning className="text-white text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                  </div>
                </div>
              </div>
              <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-red-400 to-red-500 bg-clip-text font-poppins">
                Delete Ingredient
              </h2>
              <p className="text-gray-300 text-xs xs:text-sm sm:text-base">
                Are you sure you want to delete{" "}
                <span className="text-yellow-400 font-semibold">
                  {ingredientToDelete.name}
                </span>
                ?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={async () => {
                    await handleDeleteIngredient(ingredientToDelete.id);
                    setShowDeleteModal(false);
                    setIngredientToDelete(null);
                  }}
                  className="flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-red-500/70 text-red-400 hover:bg-red-500 hover:text-white font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  <FaTrash className="group-hover:scale-110 transition-transform duration-300" />
                  Yes, Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setIngredientToDelete(null);
                  }}
                  className="flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold transition-all duration-300 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
