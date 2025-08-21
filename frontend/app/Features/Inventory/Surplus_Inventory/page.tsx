/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaExchangeAlt,
  FaPlus,
  FaFilter,
  FaSort,
  FaWarehouse,
} from "react-icons/fa";
import {
  MdInventory,
  MdWarning,
  MdCheckCircle,
  MdRefresh,
} from "react-icons/md";
import {
  FiFilter,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiEye,
} from "react-icons/fi";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import NavigationBar from "@/app/components/navigation/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import {
  useInventorySettingsAPI,
  InventorySetting,
} from "@/app/Features/Settings/inventory/hook/use-InventorySettingsAPI";
import { useInventoryAPI } from "../hook/use-inventoryAPI";
import axios from "@/app/lib/axios";
import { tree } from "next/dist/build/templates/app-page";
type InventoryItem = {
  id: number;
  name: string;
  batch: string;
  category: string;
  status: "Out Of Stock" | "Critical" | "Low" | "Normal";
  stock: number;
  added: string | Date;
  expires?: string | Date;
  expiration_date?: string;
  [key: string]: unknown;
};

export default function SurplusInventoryPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMobile } = useNavigation();
  const { deleteSurplusItem, transferSurplusToToday } = useInventoryAPI();

  // Fetch inventory settings (thresholds)
  const { fetchSettings } = useInventorySettingsAPI();
  const [settings, setSettings] = useState<InventorySetting[]>([]);

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch((err) => {
        console.error("Failed to fetch inventory settings:", err);
        setSettings([]);
      });
  }, [fetchSettings]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBatchDate, setSelectedBatchDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [itemToTransfer, setItemToTransfer] = useState<InventoryItem | null>(
    null
  );
  const [transferQuantity, setTransferQuantity] = useState<number | "">("");
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isMobile) {
      setViewMode("cards");
    } else {
      setViewMode("table");
    }
  }, [isMobile]);

  const listSurplusItems = async () => {
    const response = await axios.get("/api/inventory-surplus");
    return response.data;
  };

  const { data: inventoryData = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["surplusInventory", settings],
    queryFn: async () => {
      const items = await listSurplusItems();
      return items.map((item: any) => {
        const itemName = (item.item_name || "").toString().trim().toLowerCase();
        const setting = settings.find(
          (s) => (s.name || "").toString().trim().toLowerCase() === itemName
        );
        // Ensure threshold is a number, fallback to 100 if not set
        const threshold = Number(setting?.low_stock_threshold);
        const fallbackThreshold = 100;
        const useThreshold =
          !isNaN(threshold) && threshold > 0 ? threshold : fallbackThreshold;
        // Ensure stock is a number
        const stockQty = Number(item.stock_quantity);

        let status: "Out Of Stock" | "Critical" | "Low" | "Normal" = "Normal";

        // Determine stock status based on comprehensive business logic
        if (stockQty === 0) {
          status = "Out Of Stock";
        } else if (stockQty <= useThreshold * 0.5) {
          // Critical: when stock is 50% or less of the threshold
          status = "Critical";
        } else if (stockQty <= useThreshold) {
          // Low: when stock is at or below threshold but above critical
          status = "Low";
        } else {
          // Normal: when stock is above threshold
          status = "Normal";
        }

        return {
          ...item,
          id: item.item_id,
          name: setting?.name || item.item_name, // Use settings name if available
          batch: item.batch_date,
          category: item.category,
          stock: stockQty,
          status,
          added: item.created_at ? new Date(item.created_at) : new Date(),
          expires: item.expiration_date ? new Date(item.expiration_date) : null,
        };
      });
    },
  });

  const transferToTodayMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await transferSurplusToToday(id, quantity);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surplusInventory"] });
      queryClient.invalidateQueries({ queryKey: ["todayInventory"] });
    },
    onError: (error) => {
      console.error("Transfer failed:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteSurplusItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surplusInventory"] });
      setShowDeleteModal(false);
      setItemToDelete(null);
    },
  });

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete);
    }
  };

  const confirmTransfer = async () => {
    if (!itemToTransfer || !transferQuantity || transferQuantity <= 0) return;
    await transferToTodayMutation.mutateAsync({
      id: itemToTransfer.id,
      quantity: Number(transferQuantity),
    });

    setShowTransferModal(false);
    setItemToTransfer(null);
    setTransferQuantity("");
    queryClient.invalidateQueries({ queryKey: ["surplusInventory"] });
    queryClient.invalidateQueries({ queryKey: ["todayInventory"] });
    setTransferSuccess("Transfer successful! Item moved to Today's Inventory.");
  };

  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
    setItemToTransfer(null);
    setTransferQuantity("");
  };

  const formatDateOnly = (date: string | Date | null | undefined): string => {
    if (!date) return "N/A";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (date: string | Date | null): string => {
    if (!date) return "-";
    const dt = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dt.getTime())) return "-";
    return dt.toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getUniqueCategories = (data: InventoryItem[]) => {
    return Array.from(new Set(data.map((item) => item.category))).filter(
      Boolean
    );
  };

  const getUniqueBatchDates = (data: InventoryItem[]) => {
    return Array.from(
      new Set(data.map((item) => formatDateOnly(item.batch)))
    ).filter((date) => date !== "N/A");
  };

  const filtered = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      const matchesBatch =
        !selectedBatchDate || formatDateOnly(item.batch) === selectedBatchDate;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id?.toString().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesBatch && matchesSearch;
    });
  }, [inventoryData, selectedCategory, selectedBatchDate, searchQuery]);

  const sortedData = useMemo(() => {
    console.log("useMemo running with sortConfig:", sortConfig);
    const data = [...filtered];
    if (!sortConfig.key) {
      return data.sort((a, b) => Number(a.id) - Number(b.id));
    }
    if (sortConfig.key === "status") {
      type StockStatus = "Out Of Stock" | "Critical" | "Low" | "Normal";
      const stockOrder: Record<StockStatus, number> = {
        "Out Of Stock": 0,
        Critical: 1,
        Low: 2,
        Normal: 3,
      };
      return data.sort((a, b) =>
        sortConfig.direction === "asc"
          ? stockOrder[a.status as StockStatus] -
            stockOrder[b.status as StockStatus]
          : stockOrder[b.status as StockStatus] -
            stockOrder[a.status as StockStatus]
      );
    }
    if (sortConfig.key === "stock") {
      return data.sort((a, b) =>
        sortConfig.direction === "asc"
          ? Number(a.stock) - Number(b.stock)
          : Number(b.stock) - Number(a.stock)
      );
    }
    if (
      sortConfig.key === "added" ||
      sortConfig.key === "expires" ||
      sortConfig.key === "batch"
    ) {
      return data.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const aDate =
          aVal instanceof Date
            ? aVal
            : new Date(aVal as string | number | Date);
        const bDate =
          bVal instanceof Date
            ? bVal
            : new Date(bVal as string | number | Date);
        return sortConfig.direction === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      });
    }
    // For string columns like category, name, etc.
    return data.sort((a, b) => {
      const valA = a[sortConfig.key]?.toString().toLowerCase() || "";
      const valB = b[sortConfig.key]?.toString().toLowerCase() || "";
      return sortConfig.direction === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filtered, sortConfig]);

  const requestSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      // If clicking the same column, toggle direction
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      // If clicking a new column, start with ascending
      return {
        key,
        direction: "asc",
      };
    });
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedBatchDate("");
    setSortConfig({ key: "", direction: "asc" });
  }, []);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "batch", label: "Batch Date" },
    { key: "category", label: "Category" },
    { key: "status", label: "Status" },
    { key: "stock", label: "Stock" },
    { key: "added", label: "Procurement date" },
    { key: "expires", label: "Expiration Date" },
    { key: "actions", label: "Actions" },
  ];

  useEffect(() => {
    if (transferSuccess) {
      const timer = setTimeout(() => {
        setTransferSuccess(null);
      }, 2000); // 2 seconds
      return () => clearTimeout(timer);
    }
  }, [transferSuccess]);

  return (
    <section className="text-white font-poppins">
      <NavigationBar
        showDeleteModal={showDeleteModal}
        showTransferModal={showTransferModal}
      />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Surplus Inventory main content"
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
                        Surplus Inventory
                      </h1>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                        Manage and monitor surplus stock levels
                      </p>
                    </div>
                  </div>
                </div>
              </header>

              <div className="relative mb-6 sm:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-4 text-yellow-400/70 text-sm">
                    Surplus Inventory Management
                  </span>
                </div>
              </div>

              <section className="mb-6 sm:mb-8" aria-label="Search and filters">
                <form
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4"
                  role="search"
                >
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none">
                      <FaSearch className="text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, category, status, ID, or stock quantity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 rounded-xl px-12 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-sm sm:text-base"
                      aria-label="Search inventory"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm sm:text-base whitespace-nowrap ${
                      showFilters
                        ? "bg-yellow-400 text-black border-yellow-400"
                        : "bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50"
                    }`}
                    aria-pressed={showFilters}
                    aria-controls="surplus-filters"
                  >
                    <FiFilter className="text-sm" />
                    Filters
                    {(selectedCategory || selectedBatchDate) && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          showFilters ? "bg-black" : "bg-yellow-400"
                        }`}
                      ></span>
                    )}
                  </button>
                  {(searchQuery ||
                    selectedCategory ||
                    selectedBatchDate ||
                    sortConfig.key) && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-red-400 hover:text-red-300 underline cursor-pointer text-sm sm:text-base whitespace-nowrap px-2"
                      aria-label="Clear all filters"
                    >
                      Clear All
                    </button>
                  )}
                </form>
                {showFilters && (
                  <section
                    id="surplus-filters"
                    className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 space-y-3 sm:space-y-0 sm:flex sm:gap-4 transition-all duration-300"
                    aria-label="Filter options"
                  >
                    <div className="flex-1">
                      <label
                        className="block text-gray-300 text-xs sm:text-sm font-medium mb-2"
                        htmlFor="category-filter"
                      >
                        Category
                      </label>
                      <select
                        id="category-filter"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-gray-700/50 text-white rounded-lg px-3 py-2 border border-gray-600/50 focus:border-yellow-400 cursor-pointer text-sm transition-all"
                      >
                        <option value="">All Categories</option>
                        {getUniqueCategories(inventoryData).map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label
                        className="block text-gray-300 text-xs sm:text-sm font-medium mb-2"
                        htmlFor="batch-filter"
                      >
                        Batch Date
                      </label>
                      <select
                        id="batch-filter"
                        value={selectedBatchDate}
                        onChange={(e) => setSelectedBatchDate(e.target.value)}
                        className="w-full bg-gray-700/50 text-white rounded-lg px-3 py-2 border border-gray-600/50 focus:border-yellow-400 cursor-pointer text-sm transition-all"
                      >
                        <option value="">All Batches</option>
                        {getUniqueBatchDates(inventoryData).map((date) => (
                          <option key={date} value={date}>
                            {date}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label
                        className="block text-gray-300 text-xs sm:text-sm font-medium mb-2"
                        htmlFor="sort-filter"
                      >
                        Sort By
                      </label>
                      <select
                        id="sort-filter"
                        value={sortConfig.key}
                        onChange={(e) => {
                          const key = e.target.value;
                          setSortConfig((prev) => ({
                            key,
                            direction:
                              prev.key === key && prev.direction === "asc"
                                ? "desc"
                                : "asc",
                          }));
                        }}
                        className="w-full bg-gray-700/50 text-white rounded-lg px-3 py-2 border border-gray-600/50 focus:border-yellow-400 cursor-pointer text-sm transition-all"
                      >
                        <option value="">Default Order</option>
                        <option value="name">Name</option>
                        <option value="category">Category</option>
                        <option value="status">Status</option>
                        <option value="stock">Stock Quantity</option>
                        <option value="added">Date Added</option>
                        <option value="expires">Expiration Date</option>
                      </select>
                    </div>
                  </section>
                )}
              </section>
              <section
                className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                aria-label="Inventory table"
              >
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-left border-collapse min-w-[700px]">
                    <caption className="sr-only">
                      Surplus Inventory Table
                    </caption>
                    <thead className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col.key}
                            onClick={() =>
                              col.key !== "actions" && requestSort(col.key)
                            }
                            className={`px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 text-left font-semibold cursor-pointer select-none whitespace-nowrap text-xs xs:text-sm sm:text-base lg:text-lg transition-colors ${
                              col.key !== "actions"
                                ? "text-gray-300 hover:text-yellow-400"
                                : "text-gray-300"
                            } ${
                              sortConfig.key === col.key
                                ? "text-yellow-400"
                                : ""
                            }`}
                            scope="col"
                          >
                            <div className="flex items-center gap-1 xs:gap-2">
                              {col.label}
                              {sortConfig.key === col.key &&
                                col.key !== "actions" && (
                                  <span className="text-yellow-400">
                                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                                  </span>
                                )}
                              {col.key !== "actions" &&
                                sortConfig.key !== col.key && (
                                  <FaSort className="text-gray-500 text-xs opacity-50" />
                                )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-8 xs:py-10 sm:py-12 md:py-14 lg:py-16 text-center"
                          >
                            <div className="flex flex-col items-center gap-2 xs:gap-3 sm:gap-4">
                              <div className="w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12 border-2 xs:border-3 sm:border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                              <div className="text-yellow-400 text-sm xs:text-base sm:text-lg md:text-xl font-medium">
                                Loading inventory data...
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : sortedData.length > 0 ? (
                        sortedData.map((item: InventoryItem, index) => (
                          <tr
                            key={
                              item.id ??
                              `${item.name}-${item.batch}-${Math.random()}`
                            }
                            className={`group border-b border-gray-700/30 hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-yellow-500/5 transition-all duration-200 cursor-pointer ${
                              index % 2 === 0
                                ? "bg-gray-800/20"
                                : "bg-gray-900/20"
                            }`}
                            onClick={() => {
                              router.push(routes.ViewSurplusInventory(item.id));
                            }}
                          >
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap text-gray-300 group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                              {item.id}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap">
                              <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
                                <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="text-white group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm sm:text-base">
                              {formatDateOnly(item.batch)}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300">
                              <span className="px-1 xs:px-2 py-0.5 xs:py-1 bg-gray-700/50 rounded-md xs:rounded-lg text-xs font-medium">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap">
                              <span
                                className={`px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 rounded-full text-xs font-bold border ${
                                  item.status === "Out Of Stock"
                                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                    : item.status === "Critical"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : item.status === "Low"
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                    : "bg-green-500/20 text-green-400 border-green-500/30"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap">
                              <span className="text-white font-semibold text-sm xs:text-base sm:text-lg">
                                {item.stock}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm">
                              {formatDateTime(item.added)}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm">
                              {formatDateOnly(item.expires)}
                            </td>
                            <td className="px-3 xl:px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 xl:gap-2">
                                {/* Only Owner, General Manager, Store Manager can delete */}
                                {[
                                  "Owner",
                                  "General Manager",
                                  "Store Manager",
                                ].includes(role || "") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemToDelete(item.id);
                                      setShowDeleteModal(true);
                                    }}
                                    className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all duration-200 cursor-pointer border border-red-500/20 hover:border-red-500/40"
                                    title="Delete"
                                    aria-label="Delete item"
                                  >
                                    <FaTrash className="text-xs xs:text-sm" />
                                  </button>
                                )}
                                {/* All roles can transfer */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToTransfer(item);
                                    setShowTransferModal(true);
                                  }}
                                  className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all duration-200 cursor-pointer border border-blue-500/20 hover:border-blue-500/40"
                                  title="Transfer to Today's Inventory"
                                  aria-label="Transfer item"
                                >
                                  <FaExchangeAlt className="text-xs xs:text-sm" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 xl:px-6 py-12 xl:py-16 text-center"
                          >
                            <div className="flex flex-col items-center gap-4">
                              <MdInventory className="text-6xl text-gray-600" />
                              <div>
                                <h3 className="text-gray-400 font-medium mb-2">
                                  No items found
                                </h3>
                                <p className="text-gray-500 text-sm">
                                  Try adjusting your search or filter criteria
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </article>
          </div>
        </main>
        {showDeleteModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 xs:p-3 sm:p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-3 xs:p-4 sm:p-6 md:p-8 rounded-2xl xs:rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-6 max-w-xs xs:max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg xs:blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-2 xs:p-3 sm:p-4 rounded-full">
                    <MdWarning className="text-white text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                  </div>
                </div>
              </div>
              <h2
                id="delete-dialog-title"
                className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-red-400 to-red-500 bg-clip-text font-poppins"
              >
                Confirm Deletion
              </h2>
              <p className="text-gray-300 text-xs xs:text-sm sm:text-base">
                Are you sure you want to delete this item? This action cannot be
                undone and will permanently remove the item from your inventory.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 xs:gap-3 sm:gap-4 pt-1 xs:pt-2">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-red-500/70 text-red-400 hover:bg-red-500 hover:text-white font-semibold transition-all duration-300 order-2 sm:order-1 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  <FaTrash className="group-hover:scale-110 transition-transform duration-300" />
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold transition-all duration-300 order-1 sm:order-2 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {showTransferModal && itemToTransfer && (
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
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full">
                <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg xs:blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-2 xs:p-3 sm:p-4 rounded-full">
                      <FaExchangeAlt className="text-white text-lg xs:text-xl sm:text-2xl" />
                    </div>
                  </div>
                </div>
                <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-poppins">
                  Transfer Item
                </h2>
                <section className="text-left bg-gray-800/30 rounded-lg xs:rounded-xl p-2 xs:p-3 sm:p-4 border border-gray-700/50">
                  <p className="text-gray-300 text-xs xs:text-sm mb-1 xs:mb-2">
                    Transferring:
                  </p>
                  <p className="text-white font-semibold text-sm xs:text-base sm:text-lg">
                    {itemToTransfer.name}
                  </p>
                  <p className="text-gray-400 text-xs xs:text-sm">
                    Available: {itemToTransfer.stock} units
                  </p>
                </section>
                <div className="text-left space-y-1 xs:space-y-2">
                  <label
                    className="block text-gray-300 font-medium text-xs xs:text-sm sm:text-base"
                    htmlFor="transfer-quantity"
                  >
                    Quantity to Transfer
                  </label>
                  <input
                    id="transfer-quantity"
                    type="number"
                    min={1}
                    value={itemToTransfer.stock}
                    disabled
                    className="w-full px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl bg-gray-800/50 backdrop-blur-sm text-gray-400 border border-gray-600/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-xs xs:text-sm sm:text-base placeholder-gray-500"
                    aria-label="Quantity to transfer"
                  />
                  <p className="text-xs text-gray-400">
                    All available units will be moved to Today's Inventory.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-2 xs:gap-3 sm:gap-4 pt-1 xs:pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTransferQuantity(itemToTransfer.stock);
                      confirmTransfer();
                    }}
                    className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-blue-500/70 text-blue-400 hover:bg-blue-500 hover:text-white font-semibold transition-all duration-300 order-2 sm:order-1 cursor-pointer text-xs xs:text-sm sm:text-base"
                  >
                    {transferToTodayMutation.status === "pending" ? (
                      <>
                        <div className="w-3 xs:w-4 h-3 xs:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Transferring...
                      </>
                    ) : (
                      <>
                        <FaExchangeAlt className="group-hover:rotate-180 transition-transform duration-300" />
                        Transfer All
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseTransferModal}
                    className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold transition-all duration-300 order-1 sm:order-2 cursor-pointer text-xs xs:text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {transferSuccess && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <MdCheckCircle className="text-xl" />
            <span>{transferSuccess}</span>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
