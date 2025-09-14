"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FaTachometerAlt,
  FaBoxes,
  FaChartBar,
  FaUtensils,
  FaTruck,
  FaCog,
  FaSignOutAlt,
  FaBell,
  FaUser,
  FaTimes,
  FaChevronRight,
  FaWifi,
  FaAngleLeft,
} from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import {
  MdFullscreen,
  MdFullscreenExit,
  MdSignalWifiOff,
} from "react-icons/md";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { routes } from "@/app/routes/routes";
import { logoutUser } from "@/app/utils/API/LoginAPI";
import { supabase } from "@/app/utils/Server/supabaseClient";
import { useAuth } from "@/app/context/AuthContext";
import { useNavigation, navigationUtils } from "./hook/use-navigation";
import { usePWA, useOfflineQueue } from "@/app/hooks/usePWA";
import axios from "@/app/lib/axios";

type Notification = {
  id: number;
  message: string;
  status: string;
  created_at: string;
  type?: string; // Add 'type' property, optional for compatibility
};

// Enhanced sidebar items with PWA-specific features
const allSidebarItems = [
  {
    name: "Dashboard",
    icon: <FaTachometerAlt />,
    path: routes.dashboard,
    roles: [
      "Owner",
      "General Manager",
      "Store Manager",
      "Assistant Store Manager",
    ],
  },
  {
    name: "Inventory",
    icon: <FaBoxes />,
    path: routes.inventory,
    roles: [
      "Owner",
      "General Manager",
      "Store Manager",
      "Assistant Store Manager",
    ],
  },
  {
    name: "Report",
    icon: <FaChartBar />,
    path: routes.report,
    roles: [
      "Owner",
      "General Manager",
      "Store Manager",
      "Assistant Store Manager",
    ],
  },
  {
    name: "Menu",
    icon: <FaUtensils />,
    path: routes.menu,
    roles: [
      "Owner",
      "General Manager",
      "Store Manager",
      "Assistant Store Manager",
    ],
  },
  {
    name: "Supplier",
    icon: <FaTruck />,
    path: routes.supplier,
    roles: [
      "Owner",
      "General Manager",
      "Store Manager",
      "Assistant Store Manager",
    ],
  },
  {
    name: "Settings",
    icon: <FaCog />,
    path: routes.settings,
    roles: ["Owner", "General Manager", "Store Manager"],
  },
];

interface NavigationBarProps {
  onNavigate?: (path: string) => boolean | void;
  showDeleteModal?: boolean;
  showTransferModal?: boolean;
  showPopup?: boolean;
  exportSuccess?: boolean;
  isExporting?: boolean;
  showUnsavedModal?: boolean;
  showCancelModal?: boolean;
  showSaveModal?: boolean;
  showRemoveIngredientModal?: boolean;
  showPasswordModal?: boolean;
  PasswordModal?: boolean;
  showRestoreSourceModal?: boolean;
  isRestoring?: boolean;
  isBackingUp?: boolean;
  showEditModal?: boolean;
  showToggleModal?: boolean | ((value: boolean) => void);
  notificationModal?: Notification | null;
  backupResultMsg?: string | null;
  showHistoryModal?: boolean;
  onCloseAnyModal?: () => void;
}

const NavigationBar = ({
  onNavigate,
  showDeleteModal,
  showTransferModal,
  notificationModal,
  showPopup,
  exportSuccess,
  isExporting,
  showUnsavedModal,
  showCancelModal,
  showSaveModal,
  showRemoveIngredientModal,
  showPasswordModal,
  showToggleModal,
  showRestoreSourceModal,
  isRestoring,
  isBackingUp,
  showEditModal,
  onCloseAnyModal,
  backupResultMsg,
  showHistoryModal,
}: NavigationBarProps) => {
  // Enhanced navigation state using the improved hook
  const {
    isMenuOpen,
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    orientation,
    isPWA,
    isOnline,
    reducedMotion,
    screenSize,
    toggleMenu,
    closeMenu,
  } = useNavigation();

  // PWA Integration
  const {
    isOnline: pwaOnline,
    isInstalled,
    canInstall,
    install: installPWA,
    pwaFeatures,
  } = usePWA();

  const { addOfflineAction, getOfflineActions, syncWhenOnline } =
    useOfflineQueue();

  // Use PWA online status as primary source
  const isActuallyOnline = pwaOnline ?? isOnline;
  const offlineActionsCount = getOfflineActions().length;

  // Component state
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationModalState, setNotificationModal] =
    useState<Notification | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, role } = useAuth();
  console.log("User:", user, "Role:", role);

  // Enhanced responsive calculations
  const getSidebarWidth = () => {
    // Ultra small devices (xs: <480px)
    if (screenSize === "xs") return isMenuOpen ? "100vw" : "0";
    // Small devices (sm: 480-640px)
    if (screenSize === "sm") return isMenuOpen ? "100vw" : "0";
    // Medium devices (md: 640-768px)
    if (screenSize === "md") return isMenuOpen ? "20rem" : "4rem";
    // Large devices (lg: 768-1024px)
    if (screenSize === "lg") return isMenuOpen ? "22rem" : "4.5rem";
    // Extra large devices (xl: 1024-1280px)
    if (screenSize === "xl") return isMenuOpen ? "24rem" : "5rem";
    // 2XL and above (>1280px)
    return isMenuOpen ? "26rem" : "5rem";
  };

  const getHeaderLeftOffset = () => {
    // Full width header on mobile
    if (screenSize === "xs" || screenSize === "sm") return "0";
    // Offset by sidebar width on larger screens
    if (screenSize === "md") return isMenuOpen ? "20rem" : "4rem";
    if (screenSize === "lg") return isMenuOpen ? "22rem" : "4.5rem";
    if (screenSize === "xl") return isMenuOpen ? "24rem" : "5rem";
    return isMenuOpen ? "26rem" : "5rem";
  };

  const getIconSize = () => {
    if (screenSize === "xs") return 18;
    if (screenSize === "sm") return 19;
    if (screenSize === "md") return 20;
    if (screenSize === "lg") return 22;
    return 24;
  };

  const getHeaderHeight = () => {
    if (screenSize === "xs") return "3.5rem"; // 56px
    if (screenSize === "sm") return "4rem"; // 64px
    return "4rem"; // 64px for md and above
  };

  // Enhanced padding and spacing calculations
  const getPadding = (base: string) => {
    const paddingMap: Record<string, Record<string, string>> = {
      xs: { small: "p-2", medium: "p-3", large: "p-4" },
      sm: { small: "p-2", medium: "p-3", large: "p-4" },
      md: { small: "p-3", medium: "p-4", large: "p-5" },
      lg: { small: "p-4", medium: "p-5", large: "p-6" },
      xl: { small: "p-5", medium: "p-6", large: "p-8" },
      "2xl": { small: "p-6", medium: "p-8", large: "p-10" },
    };
    return paddingMap[screenSize]?.[base] || paddingMap.md[base];
  };

  const getTextSize = (variant: "small" | "medium" | "large" | "xlarge") => {
    const textMap: Record<string, Record<string, string>> = {
      xs: {
        small: "text-xs",
        medium: "text-sm",
        large: "text-base",
        xlarge: "text-lg",
      },
      sm: {
        small: "text-xs",
        medium: "text-sm",
        large: "text-base",
        xlarge: "text-lg",
      },
      md: {
        small: "text-sm",
        medium: "text-base",
        large: "text-lg",
        xlarge: "text-xl",
      },
      lg: {
        small: "text-sm",
        medium: "text-base",
        large: "text-lg",
        xlarge: "text-xl",
      },
      xl: {
        small: "text-base",
        medium: "text-lg",
        large: "text-xl",
        xlarge: "text-2xl",
      },
      "2xl": {
        small: "text-base",
        medium: "text-lg",
        large: "text-xl",
        xlarge: "text-2xl",
      },
    };
    return textMap[screenSize]?.[variant] || textMap.md[variant];
  };

  const getSpacing = (variant: "small" | "medium" | "large") => {
    const spacingMap: Record<string, Record<string, string>> = {
      xs: { small: "gap-1", medium: "gap-2", large: "gap-3" },
      sm: { small: "gap-2", medium: "gap-3", large: "gap-4" },
      md: { small: "gap-2", medium: "gap-3", large: "gap-4" },
      lg: { small: "gap-3", medium: "gap-4", large: "gap-5" },
      xl: { small: "gap-3", medium: "gap-4", large: "gap-6" },
      "2xl": { small: "gap-4", medium: "gap-5", large: "gap-6" },
    };
    return spacingMap[screenSize]?.[variant] || spacingMap.md[variant];
  };

  // Mobile overlay detection - should show on xs and sm screens
  const shouldShowMobileOverlay = () => {
    return (screenSize === "xs" || screenSize === "sm") && isMenuOpen;
  };

  // PWA Installation handling with enhanced hooks
  useEffect(() => {
    // Custom banner removed - using browser's default install prompt
  }, [canInstall, isInstalled]);

  // PWA Install handler using enhanced hooks
  const handleInstallPWA = async () => {
    try {
      await installPWA();
    } catch (error) {
      console.error("PWA installation failed:", error);
    }
  };

  // Fullscreen handling for PWA
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Close menu on mobile when clicking outside
  useEffect(() => {
    if (isMobile && isMenuOpen) {
      const handleOutsideClick = (e: MouseEvent) => {
        const target = e.target as Element;
        if (
          !target.closest("aside") &&
          !target.closest('button[aria-label="Open menu"]')
        ) {
          closeMenu();
        }
      };
      document.addEventListener("click", handleOutsideClick);
      return () => document.removeEventListener("click", handleOutsideClick);
    }
  }, [isMobile, isMenuOpen, closeMenu]);

  // Notifications handling
  const fetchNotifications = React.useCallback(() => {
    const userId = user?.user_id || user?.id;
    if (userId && typeof userId === "number") {
      axios
        .get(`/api/notifications?user_id=${userId}`)
        .then((res) => setNotifications(res.data.notifications || []))
        .catch(() => setNotifications([]));
    } else {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [user, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [bellOpen]);

  // Fullscreen toggle for PWA
  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  const getAnimationDuration = () =>
    navigationUtils.getAnimationDuration(reducedMotion, 300);

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => n.status === "unread").length
    : 0;

  const handleItemClick = (path: string) => {
    if (onNavigate && onNavigate(path) === false) {
      return;
    }
    // Close menu on mobile after navigation
    if (isMobile) {
      closeMenu();
    }
    router.push(path);
  };

  const handleLogout = () => setShowModal(true);

  const confirmLogout = async () => {
    setLoggingOut(true); // Show logging out modal
    setShowModal(false); // Hide confirm modal
    setTimeout(async () => {
      try {
        // Try to sign out, but catch missing session error
        try {
          await supabase.auth.signOut();
        } catch (error: any) {
          if (error.name !== "AuthSessionMissingError") {
            throw error;
          }
          // Ignore missing session error, user is already logged out
        }
        await logoutUser();
        setLoggingOut(false); // Hide logging out modal
        router.push(routes.home);
      } catch (error) {
        setLoggingOut(false);
        console.error("Error during sign out:", error);
      }
    }, 2000); // 2 seconds delay
  };

  const cancelLogout = () => setShowModal(false);

  const getFormattedDate = () => {
    const date = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dayName = days[date.getDay()];
    const dayNumber = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // Responsive date format
    if (isMobile) {
      return `${dayName}, ${dayNumber}${getOrdinalSuffix(dayNumber)} ${month}`;
    }
    return `Today is ${dayName}, ${dayNumber}${getOrdinalSuffix(
      dayNumber
    )} ${month} ${year}`;
  };

  const getOrdinalSuffix = (n: number) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  function parseDetails(details: string | undefined) {
    if (!details) return [];
    try {
      return JSON.parse(details);
    } catch {
      return [];
    }
  }

  function handleNotificationClick(n: Notification): void {
    setNotificationModal(n); // This sets notificationModalState
    setBellOpen(false);
    const userId = user?.user_id || user?.id;
    if (userId && typeof userId === "number") {
      axios
        .post(
          `/api/notifications/mark-read?user_id=${userId}&notification_id=${n.id}`
        )
        .then(() => fetchNotifications())
        .catch(() => {});
    }
  }

  function handleRemoveNotification(
    n: Notification,
    event: React.MouseEvent
  ): void {
    event.stopPropagation(); // Prevent triggering the notification click
    const userId = user?.user_id || user?.id;
    if (userId && typeof userId === "number") {
      axios
        .delete(`/api/notifications?user_id=${userId}&notification_id=${n.id}`)
        .then(() => {
          fetchNotifications();
          // If the removed notification was open in modal, close it
          if (notificationModalState?.id === n.id) {
            setNotificationModal(null);
          }
        })
        .catch((error) => {
          console.error("Failed to remove notification:", error);
        });
    }
  }

  function handleClearAllNotifications(): void {
    const userId = user?.user_id || user?.id;
    if (userId && typeof userId === "number") {
      axios
        .delete(`/api/notifications/clear-all?user_id=${userId}`)
        .then(() => {
          fetchNotifications();
          setNotificationModal(null); // Close any open notification modal
          setBellOpen(false); // Close the notification dropdown
        })
        .catch((error) => {
          console.error("Failed to clear all notifications:", error);
        });
    }
  }

  const [clientDate, setClientDate] = useState("");
  useEffect(() => {
    setClientDate(getFormattedDate());
  }, []);

  const anyModalOpen = !!(
    showDeleteModal ||
    showTransferModal ||
    showPopup ||
    exportSuccess ||
    isExporting ||
    showUnsavedModal ||
    showCancelModal ||
    showSaveModal ||
    showRemoveIngredientModal ||
    notificationModal ||
    showPasswordModal ||
    showToggleModal ||
    showRestoreSourceModal ||
    isRestoring ||
    isBackingUp ||
    showEditModal ||
    backupResultMsg ||
    showHistoryModal
  );

  const handleBurgerClick = anyModalOpen
    ? onCloseAnyModal || (() => {}) // Call unified close handler if any modal is open
    : toggleMenu; // Otherwise, toggle menu

  return (
    <>
      {/* Menu Toggle Button (Shows when sidebar is closed and no modal is open) */}
      {!isMenuOpen && (
        <button
          onClick={handleBurgerClick}
          className={`fixed group ${
            anyModalOpen
              ? "opacity-50"
              : "group-hover:scale-105 group-hover:text-yellow-400"
          }`}
          aria-label={anyModalOpen ? "Go back" : "Open menu"}
          style={{
            top: "0.5rem",
            left: "0.5rem",
            width: "3rem",
            height: "3rem",
            zIndex: 60,
          }}
          disabled={anyModalOpen}
          tabIndex={anyModalOpen ? -1 : 0}
        >
          <div
            className={`relative w-full h-full rounded-xl flex items-center justify-center
      ${
        anyModalOpen
          ? "bg-black/90 border border-transparent shadow-none"
          : "bg-gradient-to-br from-slate-900/90 via-black/90 to-gray-800/90 border border-yellow-400/20 shadow-xl group-hover:border-yellow-400/30 group-hover:shadow-yellow-400/10 backdrop-blur-lg transition-all duration-300"
      }`}
            style={anyModalOpen ? { border: "none", boxShadow: "none" } : {}}
          >
            <div className="relative flex flex-col gap-1.5 w-5 h-4 items-center justify-center">
              <GiHamburgerMenu
                className={`text-yellow-500 ${
                  !anyModalOpen ? "" : "text-yellow-500/30 backdrop-blur-3xl"
                }`}
                size={25}
              />
            </div>
          </div>
        </button>
      )}

      {/* Mobile Overlay */}
      {shouldShowMobileOverlay() && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/60 backdrop-blur-md z-40"
          onClick={closeMenu}
          style={{
            transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
      )}

      {/* Enhanced Responsive Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-950/98 via-black/98 to-gray-950/98 backdrop-blur-xl text-yellow-100 flex flex-col shadow-2xl border-r border-yellow-400/20 transition-all overflow-hidden group
          ${
            !isMenuOpen && screenSize !== "xs" && screenSize !== "sm"
              ? "hover:border-yellow-400/40"
              : ""
          }`}
        role="navigation"
        style={{
          position: "fixed",
          top: "0",
          left: 0,
          width: getSidebarWidth(),
          height: "100vh",
          // Enhanced responsive transform behavior
          transform:
            (screenSize === "xs" || screenSize === "sm") && !isMenuOpen
              ? "translateX(-100%)"
              : "translateX(0)",
          transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          zIndex: screenSize === "xs" || screenSize === "sm" ? 50 : 50,
          // Enhanced responsive shadows
          boxShadow: isMenuOpen
            ? "4px 0 32px rgba(0, 0, 0, 0.5), inset -1px 0 0 rgba(251, 191, 36, 0.1)"
            : screenSize !== "xs" && screenSize !== "sm"
            ? "2px 0 20px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(251, 191, 36, 0.15)"
            : "2px 0 16px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Enhanced Responsive Sidebar Header */}
        <header
          className={`flex items-center justify-between ${getPadding(
            "medium"
          )} ${getSpacing(
            "medium"
          )} border-b border-yellow-400/20 bg-gradient-to-r from-black/60 via-black/50 to-black/60 backdrop-blur-xl relative group`}
          style={{ height: getHeaderHeight() }}
        >
          {/* Collapsed state - Centered logo with enhanced responsive styling */}
          {!isMenuOpen && screenSize !== "xs" && screenSize !== "sm" && (
            <div className="w-full flex justify-center">
              <div
                className="relative rounded-xl overflow-hidden shadow-lg border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 via-transparent to-yellow-300/3 group-hover:border-yellow-400/30 group-hover:shadow-yellow-400/15 transition-all duration-300 group-hover:scale-105"
                style={{
                  width: getIconSize() + 16,
                  height: getIconSize() + 16,
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={getIconSize() + 16}
                  height={getIconSize() + 16}
                  className="w-full h-full object-contain relative z-10"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-yellow-300/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-yellow-400/3 to-yellow-300/5"></div>
              </div>
            </div>
          )}

          {/* Expanded state - Enhanced responsive layout */}
          {(isMenuOpen || screenSize === "xs" || screenSize === "sm") && (
            <>
              <div
                className={`flex items-center min-w-0 ${getSpacing("small")}`}
                style={{ height: getIconSize() + 16 }}
              >
                <div
                  className="flex-shrink-0 transition-all"
                  style={{
                    opacity:
                      isMenuOpen || screenSize === "xs" || screenSize === "sm"
                        ? 1
                        : 0,
                    width:
                      isMenuOpen || screenSize === "xs" || screenSize === "sm"
                        ? getIconSize() + 16
                        : 0,
                    overflow: "hidden",
                    transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  }}
                >
                  <div
                    className="relative rounded-xl overflow-hidden shadow-lg border border-yellow-400/20"
                    style={{
                      width: getIconSize() + 16,
                      height: getIconSize() + 16,
                    }}
                  >
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={getIconSize() + 16}
                      height={getIconSize() + 16}
                      className="w-full h-full object-contain"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent"></div>
                  </div>
                </div>
                <div
                  className="transition-all flex items-center group relative"
                  style={{
                    maxWidth:
                      isMenuOpen || screenSize === "xs" || screenSize === "sm"
                        ? isPWA
                          ? 180
                          : screenSize === "xs"
                          ? 140
                          : screenSize === "sm"
                          ? 160
                          : 220
                        : 0,
                    overflow: "hidden",
                    opacity:
                      isMenuOpen || screenSize === "xs" || screenSize === "sm"
                        ? 1
                        : 0,
                    height: getIconSize() + 16,
                    transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    marginLeft:
                      getSpacing("small") === "gap-1"
                        ? "0.25rem"
                        : getSpacing("small") === "gap-2"
                        ? "0.5rem"
                        : "0.75rem",
                  }}
                >
                  <div className="flex flex-col">
                    <h1
                      className="text-lg sm:text-xl font-bold text-transparent bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 bg-clip-text whitespace-nowrap tracking-wide drop-shadow-sm cursor-default"
                      title="Cardiac Delights - Restaurant Management System"
                    >
                      Cardiac Delights
                    </h1>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-black/95 text-yellow-200 text-sm rounded-lg border border-yellow-400/30 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="font-semibold">Cardiac Delights</span>
                    </div>
                    <div className="text-xs text-yellow-400 mt-1">
                      Restaurant Management System
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-black/95 border-l border-t border-yellow-400/30 transform rotate-45"></div>
                  </div>
                </div>
              </div>

              {/* Header Controls */}
              <div className="flex items-center gap-2">
                {/* PWA Fullscreen Toggle */}
                {isPWA && !isMobile && (isMenuOpen || isMobile) && (
                  <button
                    onClick={toggleFullscreen}
                    className="text-yellow-200 hover:text-yellow-400 transition-all duration-300 p-2 rounded-lg hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    aria-label={
                      isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                    }
                  >
                    {isFullscreen ? (
                      <MdFullscreenExit size={18} />
                    ) : (
                      <MdFullscreen size={18} />
                    )}
                  </button>
                )}

                {/* Mobile Close Button */}
                {isMobile && (
                  <button
                    onClick={closeMenu}
                    className="text-yellow-200 hover:text-yellow-400 transition-all duration-300 p-2 rounded-lg hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    aria-label="Close menu"
                  >
                    <FaTimes size={20} />
                  </button>
                )}

                {/* Desktop Close Arrow (only when sidebar is open) */}
                {!isMobile && isMenuOpen && (
                  <button
                    onClick={toggleMenu}
                    className="text-yellow-200 hover:text-yellow-400 transition-all duration-300 p-2 rounded-lg hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    aria-label="Close sidebar"
                  >
                    <FaAngleLeft size={18} />
                  </button>
                )}
              </div>
            </>
          )}
        </header>

        {/* Navigation Items */}
        <nav
          className={
            navigationUtils.getResponsiveClass(
              {
                xs: "flex-1 overflow-y-auto py-4 px-2",
                sm: "flex-1 overflow-y-auto py-4 px-2",
                md: "flex-1 overflow-y-auto py-6 px-2",
                lg: "flex-1 overflow-y-auto py-6 px-2",
                xl: "flex-1 overflow-y-auto py-8 px-2",
              },
              screenSize
            ) + ` ${!isMenuOpen && !isMobile ? "py-4" : ""}`
          }
        >
          <ul
            className={`space-y-3 px-1 ${
              !isMenuOpen && !isMobile ? "space-y-4" : ""
            }`}
          >
            {allSidebarItems
              .filter((item) => !role || item.roles.includes(role))
              .map(({ name, icon, path }, index) => {
                const isActive = pathname?.startsWith(path);
                return (
                  <li key={name}>
                    <button
                      onClick={() => handleItemClick(path)}
                      className={`w-full flex items-center rounded-xl cursor-pointer group relative overflow-hidden
                        transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50
                        ${
                          isMenuOpen || isMobile
                            ? "gap-3 px-4 py-3.5 justify-start"
                            : "px-2.5 py-2.5 justify-center"
                        }
                        ${
                          isActive
                            ? "bg-gradient-to-r from-yellow-500/15 via-yellow-400/10 to-yellow-300/8 text-yellow-200 font-semibold shadow-lg border border-yellow-500/25 backdrop-blur-sm"
                            : "text-yellow-100/75 hover:bg-gradient-to-r hover:from-gray-800/50 hover:via-gray-700/35 hover:to-gray-600/15 hover:text-yellow-300 border border-transparent hover:border-yellow-500/15 hover:backdrop-blur-sm"
                        }
                        ${
                          !isMenuOpen && !isMobile
                            ? "group hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/5"
                            : ""
                        }`}
                      style={{
                        transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                        height: isMenuOpen || isMobile ? "auto" : "3.5rem", // Taller for better proportions when collapsed
                        aspectRatio: isMenuOpen || isMobile ? "auto" : "1/1",
                        // Stagger animation delay for collapsed state
                        animationDelay:
                          !isMenuOpen && !isMobile ? `${index * 50}ms` : "0ms",
                      }}
                      aria-current={isActive ? "page" : undefined}
                      title={!isMenuOpen && !isMobile ? name : undefined} // Tooltip for collapsed state
                    >
                      {/* Enhanced background glow effect for active state */}
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-yellow-300/8 to-yellow-200/4 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/3 via-transparent to-yellow-300/3 rounded-xl"></div>
                        </>
                      )}

                      {/* Hover glow effect - enhanced for collapsed state */}
                      <div
                        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        ${
                          !isMenuOpen && !isMobile
                            ? "bg-gradient-to-br from-yellow-400/6 via-yellow-300/8 to-yellow-200/4"
                            : "bg-gradient-to-r from-yellow-400/3 via-yellow-300/5 to-transparent"
                        }`}
                      ></div>

                      {/* Icon container with enhanced styling for collapsed state */}
                      <div
                        className={`relative flex items-center justify-center transition-all duration-300 flex-shrink-0
                        ${isMenuOpen || isMobile ? "w-6 h-6" : "w-8 h-8"}
                        ${
                          isActive
                            ? "text-yellow-300/90 drop-shadow-md filter"
                            : "text-yellow-100/60 group-hover:text-yellow-300/80 group-hover:drop-shadow-sm"
                        }
                        ${
                          !isMenuOpen && !isMobile
                            ? "group-hover:scale-115 group-hover:rotate-2"
                            : "group-hover:scale-110"
                        }`}
                      >
                        <div className="w-full h-full flex items-center justify-center transition-transform duration-300">
                          {icon}
                        </div>

                        {/* Enhanced active indicator dots for collapsed state */}
                        {isActive && !isMenuOpen && !isMobile && (
                          <>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-yellow-300/80 to-yellow-400/80 rounded-full shadow-md shadow-yellow-400/30 animate-pulse"></div>
                            <div
                              className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-yellow-400/70 to-yellow-300/70 rounded-full shadow-sm shadow-yellow-400/20 animate-pulse"
                              style={{ animationDelay: "500ms" }}
                            ></div>
                          </>
                        )}

                        {/* Subtle animation ring for collapsed state */}
                        {!isMenuOpen && !isMobile && (
                          <div className="absolute inset-0 rounded-full border border-yellow-400/0 group-hover:border-yellow-400/15 transition-all duration-300 group-hover:scale-110"></div>
                        )}
                      </div>

                      {/* Text label with improved styling */}
                      <span
                        className="font-medium tracking-wide transition-all duration-300"
                        style={{
                          maxWidth: isMenuOpen || isMobile ? 140 : 0,
                          opacity: isMenuOpen || isMobile ? 1 : 0,
                          display: "inline-block",
                          whiteSpace: "nowrap",
                          transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                        }}
                      >
                        {name}
                      </span>

                      {/* Enhanced active chevron */}
                      {isActive && (isMenuOpen || isMobile) && (
                        <div className="ml-auto">
                          <FaChevronRight
                            size={12}
                            className="text-yellow-400 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5"
                            style={{
                              opacity: isMenuOpen || isMobile ? 1 : 0,
                              transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                            }}
                          />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>

          {/* Subtle expand hint for collapsed state */}
          {!isMenuOpen && !isMobile && (
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-yellow-700/20 to-transparent rounded-full animate-pulse"></div>
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <footer
          className={
            navigationUtils.getResponsiveClass(
              {
                xs: "py-3",
                sm: "py-3",
                md: "py-4",
                lg: "py-4",
                xl: "py-6",
              },
              screenSize
            ) +
            " border-t border-yellow-400/20 bg-gradient-to-r from-black/60 via-black/50 to-black/60 backdrop-blur-xl"
          }
        >
          <div
            className={`${
              isMenuOpen || isMobile ? "" : "flex justify-center px-1"
            }`}
          >
            <button
              onClick={handleLogout}
              className={`group relative overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400/50 flex items-center cursor-pointer
                ${
                  isMenuOpen || isMobile
                    ? "w-full gap-3 px-4 py-3.5 ml-5 justify-center rounded-xl bg-gradient-to-r from-red-900/20 via-red-800/12 to-red-700/8 border border-red-500/25 text-red-200 hover:from-red-800/30 hover:via-red-700/20 hover:to-red-600/12 hover:border-red-400/35 hover:text-red-100 backdrop-blur-sm shadow-lg"
                    : "justify-center rounded-2xl bg-gradient-to-br from-red-900/20 to-red-800/12 border border-red-500/25 text-red-200 hover:from-red-800/30 hover:to-red-700/20 hover:border-red-400/35 hover:text-red-100 hover:scale-110 shadow-lg hover:shadow-red-500/15 hover:shadow-xl"
                }`}
              style={{
                transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                height: isMenuOpen || isMobile ? "auto" : "3.5rem", // Match navigation item height
                width: isMenuOpen || isMobile ? "85%" : "3.5rem",
                minHeight: isMenuOpen || isMobile ? "3.5rem" : "3.5rem",
                minWidth: isMenuOpen || isMobile ? "auto" : "3.5rem",
              }}
              aria-label="Logout"
              title={!isMenuOpen && !isMobile ? "Logout" : undefined} // Tooltip for collapsed state
            >
              {/* Enhanced background glow effect */}
              <div
                className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300
                ${
                  !isMenuOpen && !isMobile
                    ? "bg-gradient-to-br from-red-400/10 via-red-300/12 to-red-200/6"
                    : "bg-gradient-to-r from-red-400/5 via-red-300/8 to-red-200/4"
                }`}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-br from-red-400/3 via-transparent to-red-300/3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Icon with enhanced styling for collapsed state */}
              <div
                className={`relative flex items-center justify-center transition-all duration-300 flex-shrink-0
                ${isMenuOpen || isMobile ? "w-6 h-6" : "w-8 h-8"}
                {!isMenuOpen && !isMobile ? 'group-hover:scale-115 group-hover:rotate-3' : ''}`}
              >
                <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <FaSignOutAlt
                    size={!isMenuOpen && !isMobile ? 20 : 18}
                    className="relative z-10 drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300 filter group-hover:brightness-110"
                  />
                </div>

                {/* Enhanced logout indicator for collapsed state */}
                {!isMenuOpen && !isMobile && (
                  <>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-red-400/70 to-red-500/70 rounded-full shadow-md shadow-red-400/30 opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
                    <div className="absolute inset-0 rounded-full border border-red-400/0 group-hover:border-red-400/20 transition-all duration-300 group-hover:scale-110"></div>
                  </>
                )}
              </div>

              {/* Text label with enhanced styling */}
              <span
                className="relative z-10 font-medium tracking-wide overflow-hidden transition-all duration-300"
                style={{
                  maxWidth: isMenuOpen || isMobile ? "none" : 0,
                  opacity: isMenuOpen || isMobile ? 1 : 0,
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                }}
              >
                Logout
              </span>
            </button>
          </div>

          {/* Subtle footer hint for collapsed state */}
          {!isMenuOpen && !isMobile && (
            <div className="mt-3 flex justify-center">
              <div className="w-6 h-0.5 bg-gradient-to-r from-transparent via-red-400/15 to-transparent rounded-full opacity-50"></div>
            </div>
          )}
        </footer>
      </aside>

      {/* Enhanced Responsive Header */}
      <header
        className={`fixed bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-xl text-yellow-100 z-40 flex items-center shadow-2xl border-b border-yellow-400/20 ${getPadding(
          "medium"
        )}
          ${
            screenSize === "xs" || screenSize === "sm"
              ? "justify-center left-0 right-0"
              : "justify-between right-0"
          }`}
        style={{
          transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          top: "0",
          height: getHeaderHeight(),
          left:
            screenSize === "xs" || screenSize === "sm"
              ? 0
              : getHeaderLeftOffset(),
          borderLeft:
            screenSize === "xs" || screenSize === "sm"
              ? "none"
              : "1px solid rgb(251 191 36 / 0.2)",
          boxShadow:
            "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 -1px 0 rgba(251, 191, 36, 0.1)",
        }}
      >
        {/* Enhanced Responsive Date Display */}
        <section
          className={`flex items-center ${
            screenSize === "xs" || screenSize === "sm"
              ? "justify-center w-full"
              : ""
          }`}
        >
          <div className="relative">
            <span
              className={`font-medium whitespace-nowrap overflow-hidden text-ellipsis bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 bg-clip-text text-transparent drop-shadow-sm ${getTextSize(
                "medium"
              )}`}
            >
              {clientDate}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </section>

        {/* Enhanced Responsive User Profile and Controls */}
        {(!(screenSize === "xs" || screenSize === "sm") || !isMenuOpen) && (
          <div className={`flex items-center ${getSpacing("medium")}`}>
            {/* Enhanced Responsive Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                className="relative p-2.5 rounded-xl hover:bg-gradient-to-br hover:from-yellow-400/10 hover:to-yellow-300/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 group"
                aria-label="Notifications"
                onClick={() => setBellOpen(!bellOpen)}
              >
                <FaBell
                  className="text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300"
                  size={getIconSize()}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {/* Enhanced Responsive Notification Dropdown */}
              {bellOpen && (
                <div
                  className={`absolute right-0 mt-3 bg-gradient-to-br from-black/98 via-gray-900/98 to-black/98 backdrop-blur-xl text-yellow-100 rounded-2xl shadow-2xl z-50 border border-yellow-400/20
                ${
                  screenSize === "xs"
                    ? "w-72 max-w-[calc(100vw-1rem)]"
                    : screenSize === "sm"
                    ? "w-80 max-w-[calc(100vw-2rem)]"
                    : "w-80"
                }`}
                  style={{
                    boxShadow:
                      "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(251, 191, 36, 0.1)",
                  }}
                >
                  <div className="p-4 font-bold border-b border-yellow-400/20 flex items-center justify-between bg-gradient-to-r from-yellow-400/5 to-transparent rounded-t-2xl">
                    <span className="text-yellow-200">Notifications</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                        {unreadCount} unread
                      </span>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearAllNotifications}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-full border border-red-400/20 hover:border-red-400/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                          title="Clear all notifications"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400/10 to-yellow-300/5 flex items-center justify-center">
                          <FaBell className="text-yellow-400/50 text-xl" />
                        </div>
                        <p className="text-gray-400 text-sm">
                          No notifications
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        // Decide color based on notification type or message
                        let messageColor = "text-yellow-100";
                        let bgColor = "";
                        const msg = n.message?.toLowerCase() || "";
                        const type = (n.type || "").toLowerCase();

                        // Expired/expiring soon
                        if (
                          type === "expired" ||
                          type === "expiring" ||
                          msg.includes("expired") ||
                          msg.includes("expiring soon")
                        ) {
                          messageColor = "text-red-500";
                          bgColor =
                            "bg-gradient-to-r from-red-800/18 via-red-700/15 to-transparent border-l-2 border-l-white";
                        }
                        // Low stock
                        else if (
                          type === "low_stock" ||
                          msg.includes("low stock")
                        ) {
                          messageColor = "text-orange-400";
                          bgColor =
                            "bg-gradient-to-r from-orange-800/18 via-orange-700/15 to-transparent border-l-2 border-l-orange-300";
                        }
                        // Missing threshold
                        else if (
                          type === "missing_threshold" ||
                          msg.includes("missing threshold") ||
                          msg.includes("threshold not set")
                        ) {
                          messageColor = "text-blue-400";
                          bgColor =
                            "bg-gradient-to-r from-blue-800/18 via-blue-700/15 to-transparent border-l-2 border-l-blue-300";
                        }
                        // Default unread
                        else if (n.status === "unread") {
                          messageColor = "text-yellow-200";
                          bgColor =
                            "bg-gradient-to-r from-yellow-800/18 via-yellow-700/15 to-transparent border-l-2 border-l-yellow-300";
                        }

                        // Add visual indicator for unread/read
                        const isUnread = n.status === "unread";

                        return (
                          <div
                            key={n.id}
                            className={`p-4 border-b border-yellow-400/10 cursor-pointer hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-transparent transition-all duration-300 last:border-b-0 last:rounded-b-2xl ${bgColor} flex items-start gap-3 group`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            {/* Unread/Read dot indicator */}
                            <span
                              className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                isUnread
                                  ? "bg-yellow-400 animate-pulse shadow-yellow-400/40 shadow"
                                  : "bg-gray-600"
                              }`}
                              title={isUnread ? "Unread" : "Read"}
                            ></span>
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm leading-relaxed font-medium ${messageColor}`}
                              >
                                {n.message}
                              </div>
                              <div className="text-xs text-yellow-400/70 mt-2 flex items-center gap-1">
                                <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                                {new Date(n.created_at).toLocaleString(
                                  "en-GB",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}
                                <span
                                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    isUnread
                                      ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                                      : "bg-gray-700/40 text-gray-300 border border-gray-500/40"
                                  }`}
                                >
                                  {isUnread ? "Unread" : "Read"}
                                </span>
                              </div>
                            </div>
                            {/* Remove notification button */}
                            <button
                              onClick={(e) => handleRemoveNotification(n, e)}
                              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                              title="Remove notification"
                              aria-label="Remove notification"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Responsive User Profile */}
            <div
              className={`flex items-center border border-yellow-400/30 rounded-xl bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-xl shadow-lg hover:shadow-xl hover:border-yellow-400/40 transition-all duration-300 min-w-0 group ${getPadding(
                "small"
              )} ${getSpacing("small")}
              ${
                screenSize === "xs"
                  ? "max-w-[180px]"
                  : screenSize === "sm"
                  ? "max-w-[200px]"
                  : "max-w-xs"
              }`}
            >
              <div className="flex flex-col min-w-0 max-w-full">
                <span
                  className={`font-bold bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 bg-clip-text text-transparent leading-tight font-poppins truncate drop-shadow-sm ${getTextSize(
                    "small"
                  )}`}
                >
                  {user?.name || "User"}
                </span>
                <span
                  className={`text-yellow-100/80 leading-tight font-inter truncate transition-colors duration-300 group-hover:text-yellow-200 ${getTextSize(
                    "small"
                  )}`}
                >
                  {role || "Role"}
                </span>
              </div>

              {/* Enhanced Responsive Status Indicators */}
              <div className="flex flex-col gap-1.5">
                <span
                  className={`px-2.5 py-1 rounded-full font-medium flex items-center transition-all duration-300 backdrop-blur-sm ${getTextSize(
                    "small"
                  )} ${getSpacing("small")}
                    ${
                      isActuallyOnline
                        ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border border-green-400/40 shadow-green-400/20"
                        : "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border border-red-400/40 shadow-red-400/20"
                    }`}
                >
                  {isActuallyOnline ? (
                    <FaWifi size={Math.max(8, getIconSize() - 8)} />
                  ) : (
                    <MdSignalWifiOff size={Math.max(8, getIconSize() - 8)} />
                  )}
                  {!(screenSize === "xs" || screenSize === "sm") &&
                    (isActuallyOnline ? "Online" : "Offline")}
                  {/* Show offline queue count when offline */}
                  {!isActuallyOnline &&
                    offlineActionsCount > 0 &&
                    !(screenSize === "xs" || screenSize === "sm") && (
                      <span className="ml-1 px-1.5 py-0.5 bg-gradient-to-r from-orange-500/30 to-orange-600/30 text-orange-200 rounded-full text-xs border border-orange-400/30">
                        {offlineActionsCount}
                      </span>
                    )}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {notificationModalState && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm z-[101] px-4">
          <section
            className={`bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl w-full p-6 text-left shadow-2xl border border-gray-700/50
        ${isMobile ? "max-w-sm" : "max-w-md"}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: reducedMotion ? "none" : "fadeIn 0.3s ease-out",
            }}
          >
            <div className="flex items-center gap-3 mb-4 justify-center">
              <div className="w-10 h-10 rounded-full bg-yellow-900/40 flex items-center justify-center">
                <FaBell size={24} className="text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-yellow-400">
                Notification Details
              </h3>
            </div>
            {/* Elegant Divider */}
            <div className="relative mb-6 xs:mb-7 sm:mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 px-3 xs:px-4 py-0.5 xs:py-1 rounded-full">
                  <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 bg-yellow-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold text-gray-300">Message:</span>{" "}
                <span className="text-red-600">
                  {notificationModalState.message}
                </span>
              </div>
              {/* Show details for affected items */}
              {parseDetails((notificationModalState as any).details).length >
                0 && (
                <div>
                  <span className="font-semibold text-gray-300">
                    Affected Items:
                  </span>
                  <ul className="mt-2 space-y-2">
                    {parseDetails((notificationModalState as any).details).map(
                      (item: any, idx: number) => (
                        <li
                          key={idx}
                          className="bg-gradient-to-r from-yellow-400/10 via-yellow-300/8 to-yellow-200/5 rounded-lg px-4 py-2 flex flex-col shadow-sm border border-yellow-400/10 hover:border-yellow-400/30 transition-all"
                        >
                          <div className="flex items-center gap-2 font-semibold text-yellow-200">
                            {item.name}:
                            {item.item_id && (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-900/40 text-yellow-300 text-xs rounded-full border border-yellow-400/20">
                                ID: {item.item_id}
                              </span>
                            )}
                            {item.batch_date && (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-900/30 text-yellow-200 text-xs rounded-full border border-yellow-400/15">
                                Batch {item.batch_date}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-yellow-100">
                            {typeof item.quantity !== "undefined" && (
                              <span className="px-2 py-0.5 bg-yellow-800/30 rounded-full border border-yellow-400/10">
                                Qty: {item.quantity}
                              </span>
                            )}
                            {item.expiration_date && (
                              <span className="px-2 py-0.5 bg-yellow-800/30 rounded-full border border-yellow-400/10">
                                Exp: {item.expiration_date}
                              </span>
                            )}
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-300">Status:</span>{" "}
                <span
                  className={
                    notificationModalState.status === "unread"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }
                >
                  {notificationModalState.status === "unread"
                    ? "Unread"
                    : "Read"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-300">
                  Date & Time:
                </span>{" "}
                <span className="text-gray-400">
                  {new Date(notificationModalState.created_at).toLocaleString(
                    "en-GB",
                    {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }
                  )}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  if (notificationModalState) {
                    const mockEvent = {
                      stopPropagation: () => {},
                    } as React.MouseEvent;
                    handleRemoveNotification(notificationModalState, mockEvent);
                  }
                }}
                className="px-4 py-2 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-semibold transition-all cursor-pointer"
              >
                Remove
              </button>
              <button
                onClick={() => setNotificationModal(null)}
                className="px-6 py-2 rounded-lg border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Enhanced Logout Modal */}
      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/90 backdrop-blur-sm z-[100] px-4">
          <section
            className={`bg-black/95 backdrop-blur-sm rounded-2xl w-full p-6 text-center shadow-2xl border border-yellow-900/50
              ${isMobile ? "max-w-sm" : "max-w-md"}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: reducedMotion ? "none" : "fadeIn 0.3s ease-out",
            }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-900/40 flex items-center justify-center">
              <FaSignOutAlt size={32} className="text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">
              Confirm Logout
            </h3>
            <p className="text-yellow-100 mb-8 text-sm leading-relaxed">
              Are you sure you want to log out of your account?
            </p>
            <div
              className={`flex gap-3 justify-center ${
                isMobile ? "flex-col" : "flex-row"
              }`}
            >
              <button
                onClick={confirmLogout}
                className="bg-yellow-900/70 text-yellow-100 font-semibold py-2.5 px-6 rounded-lg hover:bg-yellow-800 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              >
                Yes, Logout
              </button>
              <button
                onClick={cancelLogout}
                className="bg-transparent text-yellow-400 border border-yellow-400/50 font-semibold py-2.5 px-6 rounded-lg hover:bg-yellow-900/30 hover:text-yellow-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

      {loggingOut && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/90 backdrop-blur-sm z-[101] px-4">
          <section className="bg-black/95 backdrop-blur-sm rounded-2xl w-full p-6 text-center shadow-2xl border border-yellow-900/50 max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-900/40 flex items-center justify-center animate-bounce">
              <FaSignOutAlt size={32} className="text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">
              Logging out...
            </h3>
            <p className="text-yellow-100 mb-8 text-sm leading-relaxed">
              Please wait while we log you out.
            </p>
          </section>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default NavigationBar;
