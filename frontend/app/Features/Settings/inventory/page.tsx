/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRouter } from "next/navigation";
import { FaTrash, FaWarehouse } from "react-icons/fa";
import { useEffect, useState } from "react";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import {
  InventorySetting,
  InventorySettingInput,
  useInventorySettingsAPI,
} from "./hook/use-InventorySettingsAPI";
import { routes } from "@/app/routes/routes";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import { MdCancel, MdSave, MdWarning } from "react-icons/md";
import { FiAlertTriangle, FiSave } from "react-icons/fi";

const CATEGORIES = [
  "Meats",
  "Vegetables & Fruits",
  "Dairy & Eggs",
  "Seasonings & Condiments",
  "Rice & Noodles",
  "Cooking Oils",
  "Beverage",
];

export default function InventorySettings() {
  const { fetchSettings, createSetting, updateSetting, deleteSetting } =
    useInventorySettingsAPI();
  const router = useRouter();

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
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] =
    useState<InventorySetting | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchSettings().then((data) => {
      setIngredients(data);
      setPendingIngredients(data);
      setInitialSettings(data);
      setLoading(false); // <-- Set loading to false after fetch
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
  const handleDeleteIngredient = (id: number) => {
    setPendingIngredients((prev) => prev.filter((i) => i.id !== id));
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
      ingredients.some((ing) => ing.name.toLowerCase() === name.toLowerCase())
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
  };

  // Save all changes to Supabase
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

    // Batch API calls
    for (const item of added) await createSetting(item);
    for (const item of updated) await updateSetting(item.id, item);
    for (const item of deleted) await deleteSetting(item.id);

    setSaveMessage("Settings saved successfully!");
    setTimeout(() => setSaveMessage(""), 2000);
    setInitialSettings(pendingIngredients);
    setIngredients(pendingIngredients);
    router.push(routes.settings);
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
                <form
                  onSubmit={handleAddIngredient}
                  className="flex flex-col gap-3 mb-4 w-full
                    sm:flex-row sm:flex-wrap sm:gap-4
                    md:flex-row md:flex-nowrap md:gap-4"
                  role="form"
                >
                  <div className="flex flex-col sm:flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Ingredient Name"
                      value={newIngredient.name}
                      onChange={(e) =>
                        setNewIngredient((ni: InventorySettingInput) => ({
                          ...ni,
                          name: e.target.value,
                        }))
                      }
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 border border-yellow-400 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-200 outline-none text-sm sm:text-base w-full"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Default Unit"
                      value={newIngredient.default_unit}
                      onChange={(e) =>
                        setNewIngredient((ni: InventorySettingInput) => ({
                          ...ni,
                          default_unit: e.target.value,
                        }))
                      }
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 border border-yellow-400 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-200 outline-none text-sm sm:text-base w-full"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-1 min-w-0">
                    <select
                      value={newIngredient.category}
                      onChange={(e) =>
                        setNewIngredient((ni: InventorySettingInput) => ({
                          ...ni,
                          category: e.target.value,
                        }))
                      }
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 border border-yellow-400 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-200 outline-none text-sm sm:text-base w-full"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-1 min-w-0">
                    <input
                      type="number"
                      min={1}
                      placeholder="Threshold"
                      value={
                        newIngredient.low_stock_threshold === 0
                          ? ""
                          : newIngredient.low_stock_threshold
                      }
                      onChange={(e) =>
                        setNewIngredient((ni: InventorySettingInput) => ({
                          ...ni,
                          low_stock_threshold: Number(e.target.value),
                        }))
                      }
                      className="bg-gray-800 text-white rounded-xl px-4 py-3 border border-yellow-400 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-200 outline-none text-sm sm:text-base w-full"
                    />
                  </div>
                  <div className="flex flex-col sm:w-auto">
                    <button
                      type="submit"
                      className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
                    >
                      Add Ingredient
                    </button>
                  </div>
                </form>
                {addError && (
                  <div
                    className="text-red-400 mb-4 text-sm font-semibold animate-shake"
                    role="alert"
                  >
                    {addError}
                  </div>
                )}
              </section>
              <section
                className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                aria-label="Ingredients table"
              >
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-left border-collapse min-w-[700px]">
                    <caption className="sr-only">Ingredients Table</caption>
                    <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-yellow-300 whitespace-nowrap rounded-tl-xl">
                          Ingredient
                        </th>
                        <th className="px-4 py-3 text-left text-yellow-300 whitespace-nowrap">
                          Default Unit
                        </th>
                        <th className="px-4 py-3 text-left text-yellow-300 whitespace-nowrap">
                          Threshold
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
                      {pendingIngredients.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center text-gray-400 py-12 text-lg animate-fade-in"
                          >
                            No ingredients found. Add your first ingredient
                            above!
                          </td>
                        </tr>
                      ) : (
                        pendingIngredients.map((ing, idx) => (
                          <tr
                            key={ing.id}
                            tabIndex={0}
                            aria-label={`Row for ${ing.name}`}
                            className={`transition-colors duration-150 focus:outline-yellow-300 focus:outline-2 ${
                              idx % 2 === 0
                                ? "bg-gray-900/80"
                                : "bg-gray-800/80"
                            } hover:bg-yellow-100/10 ${
                              idx === 0 ? "rounded-t-xl" : ""
                            } ${
                              idx === ingredients.length - 1
                                ? "rounded-b-xl"
                                : ""
                            } animate-fade-in`}
                          >
                            <td className="px-4 py-3 text-white font-medium whitespace-nowrap align-middle">
                              {ing.name}
                            </td>
                            <td className="px-4 py-3 flex items-center gap-2 align-middle">
                              <input
                                type="text"
                                aria-label={`Default unit for ${ing.name}`}
                                value={ing.default_unit || ""}
                                onChange={(e) =>
                                  handleUnitChange(ing.id, e.target.value)
                                }
                                className="w-24 bg-gray-800 text-white rounded-lg px-3 py-1 border border-yellow-400 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-200 outline-none text-sm"
                              />
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
                                className="w-16 bg-gray-800 text-white rounded-lg px-3 py-1 border border-yellow-400 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-200 outline-none text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <select
                                aria-label={`Category for ${ing.name}`}
                                value={ing.category || ""}
                                onChange={(e) =>
                                  handleCategoryChange(ing.id, e.target.value)
                                }
                                className="w-40 bg-gray-800 text-white rounded-lg px-3 py-1 border border-yellow-400 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-200 outline-none text-sm"
                              >
                                <option value="">All Categories</option>
                                {CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 flex items-center gap-2 align-middle">
                              <button
                                type="button"
                                aria-label={`Delete ${ing.name}`}
                                onClick={() => {
                                  setIngredientToDelete(ing);
                                  setShowDeleteModal(true);
                                }}
                                className="px-3 py-1 bg-red-500 hover:bg-red-400 text-white rounded-lg font-semibold text-xs transition-all duration-150 shadow-sm focus:outline-yellow-300 focus:outline-2"
                                title="Delete ingredient"
                              >
                                <span className="sr-only">Delete</span>
                                Delete
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
          <div
            className="mt-8 text-green-400 text-center font-semibold animate-fade-in"
            role="status"
          >
            {saveMessage}
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
