"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";
import Pagination from "@/app/components/Pagination";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaExchangeAlt,
  FaPlus,
  FaFilter,
  FaSort,
  FaBiohazard,
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
  FiRefreshCw,
} from "react-icons/fi";
import { GiCardboardBoxClosed } from "react-icons/gi";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import NavigationBar from "@/app/components/navigation/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  useDeleteTodayInventory,
  useTransferToSpoilage,
} from "../hook/use-inventoryQuery";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { InventorySetting } from "@/app/Features/Settings/inventory/hook/use-InventorySettingsAPI";
import { TableLoading, EmptyState } from "@/app/components/LoadingStates";

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
  unit_price?: number | null;
  unit_cost?: number | null;
  unit?: string;
  [key: string]: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TodayInventoryPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMobile } = useNavigation();

  // Prefetch inventory/settings on mount
  usePrefetchInventorySettings(queryClient);

  // Aggressively cache settings with React Query
  const {
    data: settingsRaw,
    isLoading: isSettingsLoading,
    isFetching: isSettingsFetching,
    error: settingsError,
  } = useQuery<InventorySetting[]>({
    queryKey: ["inventorySettings"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/inventory-settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const settings: InventorySetting[] = Array.isArray(settingsRaw)
    ? settingsRaw
    : [];

  // Prefetch helpers
  function usePrefetchInventorySettings(
    queryClient: ReturnType<typeof useQueryClient>
  ) {
    useEffect(() => {
      queryClient.prefetchQuery({
        queryKey: ["inventorySettings"],
        queryFn: async () => {
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-settings`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        staleTime: 1000 * 60 * 60 * 12,
      });
      queryClient.prefetchQuery({
        queryKey: ["todayInventory", []],
        queryFn: async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        staleTime: 1000 * 60 * 5,
      });
    }, [queryClient]);
  }

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBatchDate, setSelectedBatchDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "asc",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  // Spoilage modal state
  const [showSpoilageModal, setShowSpoilageModal] = useState(false);
  const [itemToSpoilage, setItemToSpoilage] = useState<InventoryItem | null>(
    null
  );
  const [spoilageQuantity, setSpoilageQuantity] = useState("");
  const [spoilageReason, setSpoilageReason] = useState("");
  const [customSpoilageReason, setCustomSpoilageReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // React Query mutations
  const deleteMutationHook = useDeleteTodayInventory();
  const transferToSpoilageMutation = useTransferToSpoilage();

  useEffect(() => {
    if (isMobile) {
      setViewMode("cards");
    } else {
      setViewMode("table");
    }
  }, [isMobile]);

  const listTodayItems = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  // Patch: Use cached data when offline, and show offline message if no cache
  const [offlineToday, setOfflineToday] = useState<InventoryItem[] | null>(
    null
  );
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const {
    data: inventoryDataRaw,
    isLoading,
    isFetching,
  } = useQuery<InventoryItem[]>({
    queryKey: ["todayInventory", settings],
    queryFn: async () => {
      if (typeof window !== "undefined" && !navigator.onLine) {
        try {
          const cached = localStorage.getItem("todayInventoryCache");
          if (cached) {
            const parsed = JSON.parse(cached);
            setOfflineToday(parsed);
            setOfflineError(null);
            return parsed;
          } else {
            setOfflineToday(null);
            setOfflineError(
              "No cached inventory data available. Please connect to the internet to load today's inventory."
            );
            return [];
          }
        } catch (e) {
          setOfflineToday(null);
          setOfflineError("Failed to load cached inventory data.");
          return [];
        }
      }
      // Online: fetch and cache
      const items = await listTodayItems();
      const mapped = items.map((item: any) => {
        const itemName = (item.item_name || "").toString().trim().toLowerCase();
        const setting = (settings as InventorySetting[]).find(
          (s: InventorySetting) =>
            (s.name || "").toString().trim().toLowerCase() === itemName
        );
        // Ensure threshold is a number, fallback to 100 if not set
        const threshold = Number(setting?.low_stock_threshold);
        const fallbackThreshold = 100;
        const useThreshold =
          !isNaN(threshold) && threshold > 0 ? threshold : fallbackThreshold;
        // Ensure stock is a number
        const stockQty = Number(item.stock_quantity);
        // Get unit of measurement from settings or database
        const unit = setting?.default_unit || item.unit || "";

        let status: "Out Of Stock" | "Critical" | "Low" | "Normal" = "Normal";

        // Determine stock status based on comprehensive business logic
        if (stockQty === 0) {
          status = "Out Of Stock";
        } else if (stockQty <= useThreshold * 0.5) {
          status = "Critical";
        } else if (stockQty <= useThreshold) {
          status = "Low";
        } else {
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
          unit_price:
            item.unit_price !== undefined ? Number(item.unit_price) : null,
          unit, // Add unit to item
        };
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("todayInventoryCache", JSON.stringify(mapped));
      }
      setOfflineToday(null);
      setOfflineError(null);
      return mapped;
    },
    staleTime: 1000 * 60 * 1, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    // refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    refetchIntervalInBackground: false, // Only poll when tab is active
  });

  // Robust loading state: if offline and no cache, do not show spinner
  const shouldShowLoading =
    (isLoading || isFetching) &&
    !offlineError &&
    (typeof window === "undefined" ||
      navigator.onLine ||
      !!localStorage.getItem("todayInventoryCache"));

  // Always treat as InventoryItem[]
  const inventoryData: InventoryItem[] = Array.isArray(inventoryDataRaw)
    ? inventoryDataRaw
    : [];

  const handleRefresh = () => {
    console.log("Refreshing inventory table...");
    queryClient.invalidateQueries({ queryKey: ["todayInventory"] });
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      // Find the batch date for the item to delete
      const item = inventoryData.find((item) => item.id === itemToDelete);
      const batch_date = item?.batch;

      if (!batch_date) {
        console.error("Batch date not found for item:", itemToDelete);
        return;
      }

      await deleteMutationHook.mutateAsync({ id: itemToDelete, batch_date });

      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const formatDateOnly = (date: string | Date | null | undefined): string => {
    if (!date) return "N/A";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString("en-US");
    } catch {
      return "Invalid Date";
    }
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
    return (inventoryData as InventoryItem[]).filter((item: InventoryItem) => {
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      const matchesBatch =
        !selectedBatchDate || formatDateOnly(item.batch) === selectedBatchDate;
      const matchesStatus =
        !selectedStatus || item.status === selectedStatus;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesBatch && matchesStatus && matchesSearch;
    });
  }, [inventoryData, selectedCategory, selectedBatchDate, selectedStatus, searchQuery]);

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

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBatchDate, selectedStatus, sortConfig]);

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
    setSelectedStatus("");
    setSortConfig({ key: "", direction: "asc" });
  }, []);

  const formatDateTime = (date: string | Date | null): string => {
    if (!date) return "-";
    const dt = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dt.getTime())) return "-";
    return dt.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const columns = [
    { key: "id", label: "#" },
    { key: "name", label: "Name" },
    { key: "batch", label: "Batch Date" },
    { key: "category", label: "Category" },
    { key: "status", label: "Status" },
    { key: "stock", label: "Stock" },
    { key: "unit_cost", label: "Unit Cost" },
    { key: "total_value", label: "Total Value" },
    { key: "added", label: "Procurement date" },
    { key: "expires", label: "Expiration Date" },
    { key: "actions", label: "Actions" },
  ];

  // Open spoilage modal
  const handleTransferToSpoilage = (item: InventoryItem) => {
    setItemToSpoilage(item);
    setSpoilageQuantity("");
    setSpoilageReason("");
    setCustomSpoilageReason("");
    setShowSpoilageModal(true);
  };

  // Confirm spoilage transfer
  const confirmSpoilage = () => {
    if (
      !itemToSpoilage ||
      !spoilageQuantity ||
      Number(spoilageQuantity) <= 0 ||
      Number(spoilageQuantity) > itemToSpoilage.stock ||
      transferToSpoilageMutation.isPending
    )
      return;

    let reason = spoilageReason;
    if (spoilageReason === "Others" && customSpoilageReason.trim()) {
      reason = customSpoilageReason.trim();
    }

    transferToSpoilageMutation.mutate(
      {
        item_id: itemToSpoilage.id,
        quantity: Number(spoilageQuantity),
        reason,
      },
      {
        onSuccess: () => {
          setShowSpoilageModal(false);
          setItemToSpoilage(null);
          setSpoilageQuantity("");
          setSpoilageReason("");
          setCustomSpoilageReason("");
        },
        onError: (error) => {
          console.error("Failed to transfer to spoilage:", error);
        },
      }
    );
  };

  const handleCloseSpoilageModal = () => {
    setShowSpoilageModal(false);
    setItemToSpoilage(null);
    setSpoilageQuantity("");
    setSpoilageReason("");
    setCustomSpoilageReason("");
  };

  return (
    <section className="text-white font-poppins">
      <NavigationBar showDeleteModal={showDeleteModal} />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Today Inventory main content"
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
                        <GiCardboardBoxClosed className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text font-poppins">
                        Today's Inventory
                      </h1>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
                        Manage and monitor today's stock levels
                      </p>
                    </div>
                  </div>
                  <nav
                    aria-label="Inventory actions"
                    className="flex items-center gap-1 xs:gap-2 sm:gap-3 w-full sm:w-auto"
                  >
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 text-black px-2 xs:px-3 sm:px-4 md:px-6 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-1 xs:gap-2 cursor-pointer text-xs xs:text-sm sm:text-base whitespace-nowrap"
                    >
                      <FiRefreshCw
                        className={`text-xs xs:text-sm ${
                          isFetching ? "animate-spin" : ""
                        }`}
                      />
                      <span className="sm:inline">
                        {isFetching ? "Syncing..." : "Refresh"}
                      </span>
                    </button>
                  </nav>
                </div>
              </header>
              <div className="relative mb-6 sm:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 to-black px-4 text-yellow-400/70 text-sm">
                    Today's Inventory Management
                  </span>
                </div>
              </div>
              <section className="mb-6 sm:mb-8" aria-label="Inventory filters">
                <form
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none">
                      <FaSearch className="text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name"
                      value={searchQuery}
                      onChange={(e) => {
                        // Only allow letters and spaces
                        const value = e.target.value.replace(
                          /[^a-zA-Z\s]/g,
                          ""
                        );
                        setSearchQuery(value);
                      }}
                      className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-xl px-12 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400/50 border border-gray-600/50 hover:border-gray-500 transition-all text-sm sm:text-base"
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
                    aria-expanded={showFilters}
                    aria-controls="inventory-filters"
                  >
                    <FiFilter className="text-sm" />
                    Filters
                    {(selectedCategory || selectedBatchDate || selectedStatus) && (
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
                    selectedStatus ||
                    sortConfig.key) && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-red-400 hover:text-red-300 underline cursor-pointer text-sm sm:text-base whitespace-nowrap px-2"
                    >
                      Clear All
                    </button>
                  )}
                </form>
                {showFilters && (
                  <fieldset
                    id="inventory-filters"
                    className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 space-y-3 sm:space-y-0 sm:flex sm:gap-4 transition-all duration-300"
                  >
                    <legend className="sr-only">Filter inventory</legend>
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
                        {getUniqueCategories(
                          inventoryData as InventoryItem[]
                        ).map((category) => (
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
                        {getUniqueBatchDates(
                          inventoryData as InventoryItem[]
                        ).map((date) => (
                          <option key={date} value={date}>
                            {date}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label
                        className="block text-gray-300 text-xs sm:text-sm font-medium mb-2"
                        htmlFor="status-filter"
                      >
                        Stock Status
                      </label>
                      <select
                        id="status-filter"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-gray-700/50 text-white rounded-lg px-3 py-2 border border-gray-600/50 focus:border-yellow-400 cursor-pointer text-sm transition-all"
                      >
                        <option value="">All Status</option>
                        <option value="Normal">Normal</option>
                        <option value="Low">Low</option>
                        <option value="Critical">Critical</option>
                        <option value="Out Of Stock">Out Of Stock</option>
                      </select>
                    </div>
                  </fieldset>
                )}
              </section>
              <section
                className="bg-gray-800/30 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
                aria-label="Inventory table"
              >
                {/* Show subtle loading settings indicator if settings are loading/fetching */}
                {(isSettingsLoading || isSettingsFetching) && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-900/20 text-yellow-300 text-xs sm:text-sm">
                    <MdRefresh className="animate-spin" />
                    Loading settings...
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="table-auto w-full text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-left border-collapse min-w-[700px]">
                    <caption className="sr-only">
                      Today's Inventory List
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
                      {isLoading || isFetching ? (
                        offlineError ? (
                          <tr>
                            <td colSpan={10} className="text-center">
                              <div className="flex flex-col items-center gap-4 py-12">
                                <MdWarning className="text-yellow-400 text-5xl" />
                                <div className="text-yellow-400 text-lg font-medium">
                                  {offlineError}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={10} className="text-center">
                              <TableLoading
                                rows={itemsPerPage}
                                columns={10}
                                message="Loading inventory data..."
                              />
                            </td>
                          </tr>
                        )
                      ) : sortedData.length > 0 ? (
                        paginatedData.map((item: InventoryItem, index) => (
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
                              router.push(
                                routes.ViewTodayInventory(item.id, item.batch)
                              );
                            }}
                          >
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 font-medium whitespace-nowrap text-gray-300 group-hover:text-yellow-400 transition-colors text-xs xs:text-sm sm:text-base">
                              {(currentPage - 1) * itemsPerPage + index + 1}
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
                                {Number(item.stock) % 1 === 0 ? Number(item.stock).toFixed(0) : Number(item.stock).toFixed(2)}
                                {item.unit && (
                                  <span className="ml-1 text-gray-400 text-xs xs:text-sm font-normal">
                                    {item.unit}
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-blue-300 text-xs xs:text-sm">
                              {item.unit_cost !== undefined &&
                              item.unit_cost !== null
                                ? `₱${Number(item.unit_cost).toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-purple-300 text-xs xs:text-sm font-semibold">
                              {item.unit_cost !== undefined &&
                              item.unit_cost !== null &&
                              item.stock !== undefined
                                ? `₱${(
                                    Number(item.unit_cost) * Number(item.stock)
                                  ).toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm">
                              {formatDateTime(item.added)}
                            </td>
                            <td className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-3 sm:py-4 md:py-5 whitespace-nowrap text-gray-300 text-xs xs:text-sm">
                              {item.expires
                                ? formatDateOnly(item.expires)
                                : "No Expiration Date"}
                            </td>
                            <td className="px-3 xl:px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 xl:gap-2">
                                {[
                                  "Owner",
                                  "General Manager",
                                  "Store Manager",
                                ].includes(role || "") && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          routes.UpdateTodayInventory(
                                            item.id,
                                            item.batch
                                          )
                                        );
                                      }}
                                      className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 hover:text-yellow-300 transition-all duration-200 cursor-pointer border border-yellow-400/20 hover:border-yellow-400/40"
                                      title="Edit"
                                      aria-label={`Edit ${item.name}`}
                                    >
                                      <FaEdit className="text-xs xs:text-sm" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItemToDelete(item.id);
                                        setShowDeleteModal(true);
                                      }}
                                      className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all duration-200 cursor-pointer border border-red-500/20 hover:border-red-500/40"
                                      title="Delete"
                                      aria-label={`Delete ${item.name}`}
                                    >
                                      <FaTrash className="text-xs xs:text-sm" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTransferToSpoilage(item);
                                      }}
                                      className="p-1 xs:p-1.5 sm:p-2 rounded-md xs:rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 hover:text-purple-400 transition-all duration-200 cursor-pointer border border-purple-500/20 hover:border-purple-500/40"
                                      title="Transfer to Spoilage"
                                      aria-label={`Transfer ${item.name} to spoilage`}
                                    >
                                      <FaExchangeAlt className="text-xs xs:text-sm" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10}>
                            <EmptyState
                              icon={<MdInventory className="text-6xl" />}
                              title="No items found"
                              message="Try adjusting your search or filter criteria"
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {sortedData.length > 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={sortedData.length}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  )}
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

        {showSpoilageModal && itemToSpoilage && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="spoilage-dialog-title"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <form
              method="dialog"
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700/50 text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-md w-full"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-lg xs:blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-2 xs:p-3 sm:p-4 rounded-full">
                    <FaBiohazard className="text-white text-lg xs:text-xl sm:text-2xl md:text-3xl" />
                  </div>
                </div>
              </div>
              <h2
                id="spoilage-dialog-title"
                className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text font-poppins"
              >
                Transfer to Spoilage
              </h2>
              <p className="text-gray-300 text-xs xs:text-sm sm:text-base">
                Enter the quantity and reason for spoilage.
              </p>
              <div className="text-left space-y-1 xs:space-y-2">
                <label
                  className="block text-gray-300 font-medium text-xs xs:text-sm sm:text-base"
                  htmlFor="spoilage-quantity"
                >
                  Quantity to Spoil <span className="text-red-400">*</span>
                </label>
                <input
                  id="spoilage-quantity"
                  type="number"
                  min={0.01}
                  max={itemToSpoilage.stock}
                  step="0.01"
                  value={spoilageQuantity}
                  onChange={(e) => {
                    setSpoilageQuantity(e.target.value);
                  }}
                  placeholder={`Enter quantity (Max: ${Number(itemToSpoilage.stock) % 1 === 0 ? Number(itemToSpoilage.stock).toFixed(0) : Number(itemToSpoilage.stock).toFixed(2)})`}
                  className="w-full px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl bg-gray-800/50 backdrop-blur-sm text-white border border-gray-600/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all text-xs xs:text-sm sm:text-base placeholder-gray-500"
                  aria-label="Quantity to spoil"
                />
                <label
                  className="block text-gray-300 font-medium text-xs xs:text-sm sm:text-base mt-2"
                  htmlFor="spoilage-reason"
                >
                  Reason <span className="text-red-400">*</span>
                </label>
                <select
                  id="spoilage-reason"
                  value={spoilageReason}
                  onChange={(e) => setSpoilageReason(e.target.value)}
                  className="w-full px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl bg-gray-800/50 backdrop-blur-sm text-white border border-gray-600/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all text-xs xs:text-sm sm:text-base"
                  aria-label="Spoilage reason"
                >
                  <option value="">Select reason</option>
                  <option value="Quality Degradation">
                    Quality Degradation
                  </option>
                  <option value="Pest Infestation">Pest Infestation</option>
                  <option value="Spillage">Spillage</option>
                  <option value="Contaminated">Contaminated</option>
                  <option value="Others">Others</option>
                </select>
                {spoilageReason === "Others" && (
                  <input
                    type="text"
                    value={customSpoilageReason}
                    onChange={(e) => setCustomSpoilageReason(e.target.value)}
                    placeholder="Please specify reason"
                    className="w-full mt-2 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl bg-gray-800/50 backdrop-blur-sm text-white border border-gray-600/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all text-xs xs:text-sm sm:text-base placeholder-gray-500"
                    aria-label="Specify other spoilage reason"
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-2 xs:gap-3 sm:gap-4 pt-1 xs:pt-2">
                <button
                  type="button"
                  onClick={confirmSpoilage}
                  disabled={
                    !spoilageQuantity ||
                    Number(spoilageQuantity) <= 0 ||
                    Number(spoilageQuantity) > itemToSpoilage.stock ||
                    transferToSpoilageMutation.status === "pending"
                  }
                  className={`group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl font-semibold transition-all duration-300 order-2 sm:order-1 text-xs xs:text-sm sm:text-base ${
                    !spoilageQuantity ||
                    Number(spoilageQuantity) <= 0 ||
                    Number(spoilageQuantity) > itemToSpoilage.stock ||
                    transferToSpoilageMutation.status === "pending"
                      ? "bg-gray-600/50 text-gray-400 cursor-not-allowed border-2 border-gray-600/50"
                      : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white border-2 border-pink-500/70 hover:border-pink-400/70 cursor-pointer"
                  }`}
                >
                  {transferToSpoilageMutation.status === "pending" ? (
                    <>
                      <div className="w-3 xs:w-4 h-3 xs:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Transferring...
                    </>
                  ) : (
                    <>
                      <FaBiohazard className="group-hover:rotate-180 transition-transform duration-300" />
                      Transfer
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseSpoilageModal}
                  className="group flex items-center justify-center gap-1 xs:gap-2 px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl border-2 border-gray-500/70 text-gray-400 hover:bg-gray-500 hover:text-white font-semibold transition-all duration-300 order-1 sm:order-2 cursor-pointer text-xs xs:text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </ResponsiveMain>
    </section>
  );
}
