"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  FaAngleLeft,
} from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { routes } from "@/app/routes/routes";
import { logoutUser } from "@/app/utils/API/LoginAPI";
import { supabase } from "@/app/utils/Server/supabaseClient";
import { useAuth } from "@/app/context/AuthContext";
import { useNavigation, navigationUtils } from "./hook/use-navigation";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  showAdminPasswordModal?: boolean;
  localRestoreModalOpen?: boolean;
  modalOpen?: boolean;
  showSpoilageModal?: boolean;
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
  showAdminPasswordModal,
  localRestoreModalOpen,
  modalOpen,
  showSpoilageModal,
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
    reducedMotion,
    screenSize,
    toggleMenu,
    closeMenu,
  } = useNavigation();

  // Component state
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationModalState, setNotificationModal] =
    useState<Notification | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellPosition, setBellPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);

  // Debug: Track notification modal state changes
  useEffect(() => {
    console.log(
      "[DEBUG] notificationModalState changed:",
      notificationModalState
    );
  }, [notificationModalState]);

  // Debug: Track bellOpen state changes
  useEffect(() => {
    console.log("[Bell State Changed]:", bellOpen);
  }, [bellOpen]);
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, role } = useAuth();
  useEffect(() => {
    console.log("[NavigationBar] useAuth user/role:", { user, role });
    if (user) {
      console.log("[NavigationBar] user keys:", Object.keys(user));
      console.log("[NavigationBar] user object:", user);
    } else {
      console.log("[NavigationBar] user is null or undefined");
    }
    console.log("[NavigationBar] localStorage:", {
      cachedUser:
        typeof window !== "undefined"
          ? localStorage.getItem("cachedUser")
          : null,
      cachedRole:
        typeof window !== "undefined"
          ? localStorage.getItem("cachedRole")
          : null,
      token:
        typeof window !== "undefined" ? localStorage.getItem("token") : null,
    });
  }, [user, role]);

  // Enhanced responsive calculations with more granular breakpoints
  const getSidebarWidth = () => {
    // Mobile phones (xs: <480px)
    if (screenSize === "xs") return isMenuOpen ? "100vw" : "0";
    // Large phones/small tablets (sm: 480-640px)
    if (screenSize === "sm") return isMenuOpen ? "280px" : "0";
    // Tablets portrait (md: 640-768px)
    if (screenSize === "md") return isMenuOpen ? "320px" : "70px";
    // Tablets landscape/small laptops (lg: 768-1024px)
    if (screenSize === "lg") return isMenuOpen ? "350px" : "80px";
    // Laptops (xl: 1024-1280px)
    if (screenSize === "xl") return isMenuOpen ? "380px" : "90px";
    // Desktop (2xl: >1280px)
    return isMenuOpen ? "400px" : "100px";
  };

  const getHeaderLeftOffset = () => {
    // Full width header on mobile and small tablets
    if (screenSize === "xs" || screenSize === "sm") return "0";
    // Offset by sidebar width on larger screens
    if (screenSize === "md") return isMenuOpen ? "320px" : "70px";
    if (screenSize === "lg") return isMenuOpen ? "350px" : "80px";
    if (screenSize === "xl") return isMenuOpen ? "380px" : "90px";
    return isMenuOpen ? "400px" : "100px";
  };

  const getIconSize = () => {
    if (screenSize === "xs") return 16;
    if (screenSize === "sm") return 18;
    if (screenSize === "md") return 20;
    if (screenSize === "lg") return 22;
    if (screenSize === "xl") return 24;
    return 26; // 2xl and above
  };

  const getHeaderHeight = () => {
    if (screenSize === "xs") return "56px"; // Mobile
    if (screenSize === "sm") return "60px"; // Large mobile
    if (screenSize === "md") return "64px"; // Tablet
    return "68px"; // Desktop and larger
  };

  // Enhanced padding and spacing calculations with better device targeting
  const getPadding = (base: string) => {
    const paddingMap: Record<string, Record<string, string>> = {
      xs: { small: "p-1.5", medium: "p-2", large: "p-3" },
      sm: { small: "p-2", medium: "p-2.5", large: "p-3.5" },
      md: { small: "p-2.5", medium: "p-3", large: "p-4" },
      lg: { small: "p-3", medium: "p-4", large: "p-5" },
      xl: { small: "p-4", medium: "p-5", large: "p-6" },
      "2xl": { small: "p-5", medium: "p-6", large: "p-8" },
    };
    return paddingMap[screenSize]?.[base] || paddingMap.md[base];
  };

  const getTextSize = (
    variant: "xs" | "small" | "medium" | "large" | "xlarge"
  ) => {
    const textMap: Record<string, Record<string, string>> = {
      xs: {
        xs: "text-xs",
        small: "text-xs",
        medium: "text-sm",
        large: "text-base",
        xlarge: "text-lg",
      },
      sm: {
        xs: "text-xs",
        small: "text-sm",
        medium: "text-sm",
        large: "text-base",
        xlarge: "text-lg",
      },
      md: {
        xs: "text-xs",
        small: "text-sm",
        medium: "text-base",
        large: "text-lg",
        xlarge: "text-xl",
      },
      lg: {
        xs: "text-sm",
        small: "text-sm",
        medium: "text-base",
        large: "text-lg",
        xlarge: "text-xl",
      },
      xl: {
        xs: "text-sm",
        small: "text-base",
        medium: "text-lg",
        large: "text-xl",
        xlarge: "text-2xl",
      },
      "2xl": {
        xs: "text-sm",
        small: "text-base",
        medium: "text-lg",
        large: "text-xl",
        xlarge: "text-2xl",
      },
    };
    return textMap[screenSize]?.[variant] || textMap.md[variant];
  };

  const getSpacing = (variant: "xs" | "small" | "medium" | "large") => {
    const spacingMap: Record<string, Record<string, string>> = {
      xs: { xs: "gap-0.5", small: "gap-1", medium: "gap-1.5", large: "gap-2" },
      sm: { xs: "gap-1", small: "gap-1.5", medium: "gap-2", large: "gap-3" },
      md: { xs: "gap-1", small: "gap-2", medium: "gap-2.5", large: "gap-3" },
      lg: { xs: "gap-1.5", small: "gap-2", medium: "gap-3", large: "gap-4" },
      xl: { xs: "gap-2", small: "gap-3", medium: "gap-4", large: "gap-5" },
      "2xl": { xs: "gap-2", small: "gap-3", medium: "gap-4", large: "gap-6" },
    };
    return spacingMap[screenSize]?.[variant] || spacingMap.md[variant];
  };

  // Device-specific behavior helpers
  const isMobileDevice = () => screenSize === "xs";
  const isSmallTablet = () => screenSize === "sm";
  const isTabletDevice = () => screenSize === "md";
  const isLaptopDevice = () => screenSize === "lg" || screenSize === "xl";
  const isDesktopDevice = () => screenSize === "2xl";
  const isCompactDevice = () => screenSize === "xs" || screenSize === "sm";
  const isExpandedDevice = () =>
    screenSize === "lg" || screenSize === "xl" || screenSize === "2xl";

  // Mobile overlay detection - enhanced for all compact devices
  const shouldShowMobileOverlay = () => {
    return isCompactDevice() && isMenuOpen;
  };

  // PWA Installation - removed (using PWAInstallBanner component instead)

  // Fullscreen handling for PWA
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Close menu on mobile when clicking outside - enhanced for all compact devices
  useEffect(() => {
    if (isCompactDevice() && isMenuOpen) {
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
  }, [isCompactDevice(), isMenuOpen, closeMenu]);

  // Notifications handling

  const fetchNotifications = React.useCallback(async () => {
    // Try user_id first (number), then fallback to parsing id if it's a string
    let userId = user?.user_id;

    // If user_id is not available, try to parse id if it's a string number
    if (!userId && user?.id) {
      if (typeof user.id === "number") {
        userId = user.id;
      } else if (typeof user.id === "string") {
        const parsed = parseInt(user.id, 10);
        if (!isNaN(parsed)) {
          userId = parsed;
        }
      }
    }

    console.log("[Notifications] Full user object:", user);
    console.log("[Notifications] user.user_id:", user?.user_id);
    console.log("[Notifications] user.id:", user?.id);
    console.log("[Notifications] Resolved userId:", userId);
    console.log("[Notifications] userId type:", typeof userId);

    if (userId && typeof userId === "number") {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/notifications?user_id=${userId}`
        );
        const data = await res.json();
        console.log("[Notifications] API Response:", data);
        console.log(
          "[Notifications] Received:",
          data.notifications?.length || 0,
          "notifications"
        );
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("[Notifications] Fetch error:", error);
        setNotifications([]);
      }
    } else {
      console.log(
        "[Notifications] No valid user ID - userId:",
        userId,
        "type:",
        typeof userId
      );
      setNotifications([]);
    }
  }, [user]);

  // Track previous notification count to detect new notifications
  const prevNotificationCountRef = useRef<number>(0);
  const isFirstMountRef = useRef<boolean>(true);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [user, fetchNotifications]);

  // Trigger toast notifications for new unread notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter(
      (n) => n.status === "unread"
    );
    const currentUnreadCount = unreadNotifications.length;

    console.log("[Toast Debug] isFirstMount:", isFirstMountRef.current);
    console.log("[Toast Debug] currentUnreadCount:", currentUnreadCount);
    console.log("[Toast Debug] prevCount:", prevNotificationCountRef.current);

    // On first mount, just set the initial count without showing toasts
    if (isFirstMountRef.current) {
      console.log(
        "[Toast Debug] First mount - setting initial count to",
        currentUnreadCount
      );
      prevNotificationCountRef.current = currentUnreadCount;
      isFirstMountRef.current = false;
      return;
    }

    // Only show toast if we have new notifications (count increased)
    if (currentUnreadCount > prevNotificationCountRef.current) {
      const newNotificationsCount =
        currentUnreadCount - prevNotificationCountRef.current;
      console.log(
        "[Toast Debug] NEW NOTIFICATIONS DETECTED:",
        newNotificationsCount
      );

      // Get the newest notifications (based on how many new ones we have)
      const newNotifications = unreadNotifications.slice(
        0,
        newNotificationsCount
      );
      console.log(
        "[Toast Debug] Showing toasts for:",
        newNotifications.map((n) => n.message)
      );

      // Show toast for each new notification (limit to 3 to avoid spam)
      const toastsToShow = newNotifications.slice(0, 3);
      toastsToShow.forEach((notification, index) => {
        setTimeout(() => {
          console.log("[Toast Debug] Showing toast:", notification.message);
          const toastId = toast.info(notification.message, {
            description: new Date(notification.created_at).toLocaleString(),
            action: {
              label: "View",
              onClick: () => {
                console.log(
                  "[Toast Debug] View button clicked, dismissing toast and opening bell"
                );
                toast.dismiss(toastId);
                setBellOpen(true);
              },
            },
            duration: 8000,
          });
        }, index * 500); // Stagger toasts by 500ms to avoid overlapping
      });

      // If more than 3 new notifications, show a summary toast
      if (newNotificationsCount > 3) {
        setTimeout(() => {
          const summaryToastId = toast.info(
            `${newNotificationsCount - 3} more notifications`,
            {
              description: "Click the bell icon to view all",
              action: {
                label: "View All",
                onClick: () => {
                  console.log(
                    "[Toast Debug] View All button clicked, dismissing toast and opening bell"
                  );
                  toast.dismiss(summaryToastId);
                  setBellOpen(true);
                },
              },
              duration: 8000,
            }
          );
        }, 1500);
      }
    } else {
      console.log("[Toast Debug] No new notifications to show");
    }

    // Update the previous count
    prevNotificationCountRef.current = currentUnreadCount;
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if click is inside bell icon
      const isInsideBell = bellRef.current && bellRef.current.contains(target);

      // Check if click is inside notification dropdown (which is rendered via portal)
      const isInsideDropdown = (target as Element).closest(
        ".notification-dropdown-portal"
      );

      if (!isInsideBell && !isInsideDropdown) {
        console.log("[Bell] Click outside detected, closing");
        setBellOpen(false);
      }
    }
    if (bellOpen) {
      // Use setTimeout to avoid race condition with the click event that opened the dropdown
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
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
    // Close menu on mobile after navigation - enhanced for all compact devices
    if (isCompactDevice()) {
      closeMenu();
    }
    // Always allow navigation, even offline
    router.push(path);
  };

  const formatQuantity = (value: number | undefined): string => {
    if (value === undefined || value === null) return "0";
    // Check if the number is a whole number
    if (Number.isInteger(value)) {
      return value.toString();
    }
    // If it has decimals, format to 2 decimal places
    return value.toFixed(2);
  };

  const handleLogout = () => setShowModal(true);

  const confirmLogout = async () => {
    setLoggingOut(true); // Show logging out modal
    setShowModal(false); // Hide confirm modal
    setTimeout(async () => {
      try {
        // Clear localStorage FIRST before signOut to prevent race condition
        await logoutUser();

        // Then sign out from Supabase
        try {
          await supabase.auth.signOut();
        } catch (error: any) {
          if (error.name !== "AuthSessionMissingError") {
            throw error;
          }
          // Ignore missing session error, user is already logged out
        }

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

    // Responsive date format - enhanced for all device types
    if (isCompactDevice()) {
      return `${dayName.slice(0, 3)}, ${dayNumber}${getOrdinalSuffix(
        dayNumber
      )} ${month.slice(0, 3)}`;
    }
    if (isTabletDevice()) {
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

  function getNotificationMessageColor(type: string | undefined): string {
    const notifType = (type || "").toLowerCase();

    // Out of stock - Darkest Red (most urgent)
    if (notifType === "out_of_stock") {
      return "text-red-600";
    }
    // Critical stock alert - Red (very urgent)
    if (notifType === "critical_stock" || notifType.includes("critical")) {
      return "text-red-500";
    }
    // Expired alert - Orange
    if (notifType === "expired") {
      return "text-orange-500";
    }
    // Low stock - Yellow
    if (notifType === "low_stock") {
      return "text-yellow-400";
    }
    // Expiring soon - Orange
    if (notifType === "expiring_soon") {
      return "text-orange-400";
    }
    // Transfer to spoilage (auto or manual) - Violet/Purple
    if (notifType.includes("spoilage")) {
      return "text-purple-400";
    }
    // Any transfer (auto or manual) - Blue
    if (notifType.includes("transfer")) {
      return "text-blue-400";
    }
    // Default - Gray
    return "text-gray-300";
  }

  async function handleNotificationClick(n: Notification) {
    console.log("[DEBUG] Notification clicked:", n);
    setNotificationModal(n); // This sets notificationModalState
    console.log("[DEBUG] Notification modal state set to:", n);
    setBellOpen(false);
    const userId = user?.user_id || user?.id;
    // Only mark as read if notification has a valid ID
    if (
      userId &&
      typeof userId === "number" &&
      n.id !== null &&
      n.id !== undefined
    ) {
      try {
        await fetch(
          `${API_BASE_URL}/api/notifications/mark-read?user_id=${userId}&notification_id=${n.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        fetchNotifications();
      } catch (error) {
        console.error("[DEBUG] Error marking notification as read:", error);
      }
    }
  }

  async function handleRemoveNotification(
    n: Notification,
    event: React.MouseEvent
  ) {
    event.stopPropagation(); // Prevent triggering the notification click
    const userId = user?.user_id || user?.id;
    // Only delete if notification has a valid ID
    if (
      userId &&
      typeof userId === "number" &&
      n.id !== null &&
      n.id !== undefined
    ) {
      try {
        await fetch(
          `${API_BASE_URL}/api/notifications?user_id=${userId}&notification_id=${n.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        fetchNotifications();
        // If the removed notification was open in modal, close it
        if (notificationModalState?.id === n.id) {
          setNotificationModal(null);
        }
      } catch (error) {
        console.error("Failed to remove notification:", error);
      }
    } else {
      // If notification has no ID, show a warning
      console.warn(
        "Cannot delete notification without ID. Please run database migration."
      );
    }
  }

  async function handleClearAllNotifications() {
    const userId = user?.user_id || user?.id;
    if (userId && typeof userId === "number") {
      try {
        await fetch(
          `${API_BASE_URL}/api/notifications/clear-all?user_id=${userId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        fetchNotifications();
        setNotificationModal(null); // Close any open notification modal
        setBellOpen(false); // Close the notification dropdown
      } catch (error) {
        console.error("Failed to clear all notifications:", error);
      }
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
    notificationModalState || // Check local notification modal state
    showPasswordModal ||
    showToggleModal ||
    showRestoreSourceModal ||
    isRestoring ||
    isBackingUp ||
    showEditModal ||
    backupResultMsg ||
    showHistoryModal ||
    showAdminPasswordModal ||
    localRestoreModalOpen ||
    modalOpen ||
    showSpoilageModal
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
          className={`fixed group z-[60] transition-all duration-300 ${
            anyModalOpen
              ? "opacity-50 cursor-not-allowed"
              : "opacity-100 hover:scale-105 active:scale-95"
          }`}
          aria-label={anyModalOpen ? "Go back" : "Open menu"}
          style={{
            top: isCompactDevice() ? "0.75rem" : "0.5rem",
            left: isCompactDevice()
              ? "0.75rem"
              : screenSize === "md"
              ? "calc(35px - 1.5rem)" // 70px / 2 - half button width
              : screenSize === "lg"
              ? "calc(40px - 1.5rem)" // 80px / 2 - half button width
              : screenSize === "xl"
              ? "calc(45px - 1.5rem)" // 90px / 2 - half button width
              : "calc(50px - 1.5rem)", // 100px / 2 - half button width (2xl)
            width: isCompactDevice() ? "2.75rem" : "3rem",
            height: isCompactDevice() ? "2.75rem" : "3rem",
          }}
          disabled={anyModalOpen}
          tabIndex={anyModalOpen ? -1 : 0}
        >
          <div
            className={`relative w-full h-full rounded-xl flex items-center justify-center transition-all duration-300
        ${
          anyModalOpen
            ? "bg-black/90 border border-transparent shadow-none"
            : "bg-gradient-to-br from-slate-900/95 via-black/95 to-gray-800/95 border border-yellow-400/30 shadow-xl hover:border-yellow-400/50 hover:shadow-yellow-400/20 backdrop-blur-xl hover:from-slate-800/95 hover:via-black/95 hover:to-gray-700/95"
        }`}
            style={anyModalOpen ? { border: "none", boxShadow: "none" } : {}}
          >
            <div className="relative flex items-center justify-center">
              <GiHamburgerMenu
                className={`transition-all duration-300 ${
                  anyModalOpen
                    ? "text-yellow-500/30"
                    : "text-yellow-400 group-hover:text-yellow-300 group-hover:scale-110"
                }`}
                size={isCompactDevice() ? 22 : 24}
              />
            </div>
            {/* Glow effect on hover */}
            {!anyModalOpen && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/0 via-yellow-300/0 to-yellow-200/0 group-hover:from-yellow-400/10 group-hover:via-yellow-300/5 group-hover:to-yellow-200/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
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
            !isMenuOpen && !isCompactDevice()
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
            isCompactDevice() && !isMenuOpen
              ? "translateX(-100%)"
              : "translateX(0)",
          transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          zIndex: isMenuOpen && isCompactDevice() ? 45 : 10,
          // Enhanced responsive shadows based on device type
          boxShadow: isMenuOpen
            ? "4px 0 32px rgba(0, 0, 0, 0.5), inset -1px 0 0 rgba(251, 191, 36, 0.1)"
            : !isCompactDevice()
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
          )} border-b border-yellow-400/20 bg-gradient-to-r from-black/60 via-black/50 to-black/60 backdrop-blur-xl relative group overflow-hidden`}
          style={{ height: getHeaderHeight(), minHeight: getHeaderHeight() }}
        >
          {/* Collapsed state - Logo hidden when sidebar is closed */}

          {/* Expanded state - Enhanced responsive layout */}
          {(isMenuOpen || isCompactDevice()) && (
            <>
              <div
                className={`flex items-center min-w-0 ${getSpacing("small")}`}
                style={{
                  height: getIconSize() + (isExpandedDevice() ? 20 : 16),
                }}
              >
                <div
                  className="flex-shrink-0 transition-all"
                  style={{
                    opacity: isMenuOpen || isCompactDevice() ? 1 : 0,
                    width:
                      isMenuOpen || isCompactDevice()
                        ? getIconSize() + (isExpandedDevice() ? 20 : 16)
                        : 0,
                    overflow: "hidden",
                    transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  }}
                >
                  <div
                    className="relative rounded-xl overflow-hidden shadow-lg border border-yellow-400/20"
                    style={{
                      width: getIconSize() + (isExpandedDevice() ? 20 : 16),
                      height: getIconSize() + (isExpandedDevice() ? 20 : 16),
                    }}
                  >
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={getIconSize() + (isExpandedDevice() ? 20 : 16)}
                      height={getIconSize() + (isExpandedDevice() ? 20 : 16)}
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
                      isMenuOpen || isCompactDevice()
                        ? isPWA
                          ? isExpandedDevice()
                            ? 220
                            : isTabletDevice()
                            ? 180
                            : 160
                          : isExpandedDevice()
                          ? 260
                          : isTabletDevice()
                          ? 200
                          : isSmallTablet()
                          ? 180
                          : 140
                        : 0,
                    overflow: "hidden",
                    opacity: isMenuOpen || isCompactDevice() ? 1 : 0,
                    height: getIconSize() + (isExpandedDevice() ? 20 : 16),
                    transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    marginLeft: getSpacing("small").includes("gap-0.5")
                      ? "2px"
                      : getSpacing("small").includes("gap-1")
                      ? "4px"
                      : "6px",
                  }}
                >
                  <div className="flex flex-col">
                    <h1
                      className={`font-bold text-transparent bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 bg-clip-text whitespace-nowrap tracking-wide drop-shadow-sm cursor-default ${
                        isDesktopDevice()
                          ? "text-xl"
                          : isLaptopDevice()
                          ? "text-lg"
                          : isTabletDevice()
                          ? "text-base"
                          : "text-sm"
                      }`}
                      title="Cardiac Delights - Restaurant Management System"
                    >
                      Cardiac Delights
                    </h1>
                  </div>

                  {/* Enhanced Tooltip for larger screens */}
                  {!isCompactDevice() && (
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
                  )}
                </div>
              </div>

              {/* Header Controls - Enhanced for all device types */}
              <div className={`flex items-center ${getSpacing("xs")}`}>
                {/* PWA Fullscreen Toggle - only on larger devices */}
                {isPWA &&
                  !isCompactDevice() &&
                  (isMenuOpen || !isCompactDevice()) && (
                    <button
                      onClick={toggleFullscreen}
                      className="text-yellow-200 hover:text-yellow-400 transition-all duration-300 p-2 rounded-lg hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      aria-label={
                        isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                      }
                    >
                      {isFullscreen ? (
                        <MdFullscreenExit size={getIconSize() - 2} />
                      ) : (
                        <MdFullscreen size={getIconSize() - 2} />
                      )}
                    </button>
                  )}

                {/* Mobile Close Button */}
                {isCompactDevice() && (
                  <button
                    onClick={closeMenu}
                    className="text-yellow-200 hover:text-yellow-400 transition-all duration-300 p-2 rounded-lg hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    aria-label="Close menu"
                  >
                    <FaTimes size={getIconSize() - 2} />
                  </button>
                )}

                {/* Desktop Close Arrow (only when sidebar is open) */}
                {!isCompactDevice() && isMenuOpen && (
                  <button
                    onClick={toggleMenu}
                    className="text-yellow-200 hover:text-yellow-400 transition-all duration-300 p-2 rounded-lg hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    aria-label="Close sidebar"
                  >
                    <FaAngleLeft size={getIconSize() - 2} />
                  </button>
                )}
              </div>
            </>
          )}
        </header>

        {/* Navigation Items - Fully Responsive */}
        <nav
          className={
            navigationUtils.getResponsiveClass(
              {
                xs: "flex-1 overflow-y-auto py-2 px-1.5",
                sm: "flex-1 overflow-y-auto py-3 px-2",
                md: "flex-1 overflow-y-auto py-4 px-2",
                lg: "flex-1 overflow-y-auto py-5 px-2.5",
                xl: "flex-1 overflow-y-auto py-6 px-3",
              },
              screenSize
            ) + ` ${!isMenuOpen && !isCompactDevice() ? "py-4" : ""}`
          }
        >
          <ul
            className={`${getSpacing("small")} px-1 ${
              !isMenuOpen && !isCompactDevice() ? getSpacing("medium") : ""
            }`}
            style={{ display: "flex", flexDirection: "column" }}
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
                          isMenuOpen || isCompactDevice()
                            ? `${getSpacing("xs")} ${getPadding(
                                "small"
                              )} justify-start`
                            : `${getPadding("xs")} justify-center`
                        }
                        ${
                          isActive
                            ? "bg-gradient-to-r from-yellow-500/15 via-yellow-400/10 to-yellow-300/8 text-yellow-200 font-semibold shadow-lg border border-yellow-500/25 backdrop-blur-sm"
                            : "text-yellow-100/75 hover:bg-gradient-to-r hover:from-gray-800/50 hover:via-gray-700/35 hover:to-gray-600/15 hover:text-yellow-300 border border-transparent hover:border-yellow-500/15 hover:backdrop-blur-sm"
                        }
                        ${
                          !isMenuOpen && !isCompactDevice()
                            ? "group hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/5"
                            : ""
                        }`}
                      style={{
                        transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                        height:
                          isMenuOpen || isCompactDevice()
                            ? "auto"
                            : isDesktopDevice()
                            ? "56px"
                            : isLaptopDevice()
                            ? "52px"
                            : "48px",
                        aspectRatio:
                          isMenuOpen || isCompactDevice() ? "auto" : "1/1",
                        minHeight:
                          isMenuOpen || isCompactDevice()
                            ? isDesktopDevice()
                              ? "48px"
                              : isLaptopDevice()
                              ? "44px"
                              : isTabletDevice()
                              ? "40px"
                              : "36px"
                            : "auto",
                        // Stagger animation delay for collapsed state
                        animationDelay:
                          !isMenuOpen && !isCompactDevice()
                            ? `${index * 50}ms`
                            : "0ms",
                      }}
                      aria-current={isActive ? "page" : undefined}
                      title={
                        !isMenuOpen && !isCompactDevice() ? name : undefined
                      }
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
                          !isMenuOpen && !isCompactDevice()
                            ? "bg-gradient-to-br from-yellow-400/6 via-yellow-300/8 to-yellow-200/4"
                            : "bg-gradient-to-r from-yellow-400/3 via-yellow-300/5 to-transparent"
                        }`}
                      ></div>

                      {/* Icon container with device-specific sizing */}
                      <div
                        className={`relative flex items-center justify-center transition-all duration-300 flex-shrink-0
                        ${
                          isActive
                            ? "text-yellow-300/90 drop-shadow-md filter"
                            : "text-yellow-100/60 group-hover:text-yellow-300/80 group-hover:drop-shadow-sm"
                        }
                        ${
                          !isMenuOpen && !isCompactDevice()
                            ? "group-hover:scale-115 group-hover:rotate-2"
                            : "group-hover:scale-110"
                        }`}
                        style={{
                          width:
                            isMenuOpen || isCompactDevice()
                              ? isDesktopDevice()
                                ? "28px"
                                : isLaptopDevice()
                                ? "26px"
                                : isTabletDevice()
                                ? "24px"
                                : "20px"
                              : isDesktopDevice()
                              ? "32px"
                              : isLaptopDevice()
                              ? "30px"
                              : "28px",
                          height:
                            isMenuOpen || isCompactDevice()
                              ? isDesktopDevice()
                                ? "28px"
                                : isLaptopDevice()
                                ? "26px"
                                : isTabletDevice()
                                ? "24px"
                                : "20px"
                              : isDesktopDevice()
                              ? "32px"
                              : isLaptopDevice()
                              ? "30px"
                              : "28px",
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center transition-transform duration-300">
                          {icon}
                        </div>

                        {/* Enhanced active indicator dots for collapsed state */}
                        {isActive && !isMenuOpen && !isCompactDevice() && (
                          <>
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-yellow-300/80 to-yellow-400/80 rounded-full shadow-md shadow-yellow-400/30 animate-pulse"></div>
                            <div
                              className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-yellow-400/70 to-yellow-300/70 rounded-full shadow-sm shadow-yellow-400/20 animate-pulse"
                              style={{ animationDelay: "500ms" }}
                            ></div>
                          </>
                        )}

                        {/* Subtle animation ring for collapsed state */}
                        {!isMenuOpen && !isCompactDevice() && (
                          <div className="absolute inset-0 rounded-full border border-yellow-400/0 group-hover:border-yellow-400/15 transition-all duration-300 group-hover:scale-110"></div>
                        )}
                      </div>

                      {/* Text label with device-specific styling */}
                      <span
                        className={`font-medium tracking-wide transition-all duration-300 ${getTextSize(
                          "small"
                        )}`}
                        style={{
                          maxWidth:
                            isMenuOpen || isCompactDevice()
                              ? isDesktopDevice()
                                ? "180px"
                                : isLaptopDevice()
                                ? "160px"
                                : isTabletDevice()
                                ? "140px"
                                : "120px"
                              : 0,
                          opacity: isMenuOpen || isCompactDevice() ? 1 : 0,
                          display: "inline-block",
                          whiteSpace: "nowrap",
                          transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                        }}
                      >
                        {name}
                      </span>

                      {/* Enhanced active chevron */}
                      {isActive && (isMenuOpen || isCompactDevice()) && (
                        <div className="ml-auto">
                          <FaChevronRight
                            size={
                              isDesktopDevice()
                                ? 14
                                : isLaptopDevice()
                                ? 12
                                : 10
                            }
                            className="text-yellow-400 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5"
                            style={{
                              opacity: isMenuOpen || isCompactDevice() ? 1 : 0,
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
          {!isMenuOpen && !isCompactDevice() && (
            <div className="mt-6 flex justify-center">
              <div
                className={`bg-gradient-to-r from-transparent via-yellow-700/20 to-transparent rounded-full animate-pulse ${
                  isDesktopDevice() ? "w-10 h-0.5" : "w-8 h-0.5"
                }`}
              ></div>
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
          {/* Privacy Policy Link */}
          <div
            className={`mt-2 flex justify-center ${
              isMenuOpen || isMobile ? "" : "px-1"
            }`}
          >
            <a
              href="/privacy-policy"
              target="_self"
              className="text-xs text-yellow-300 hover:text-yellow-400 underline transition-colors duration-200 py-2"
              style={{
                display: "block",
                textAlign: "center",
                width: isMenuOpen || isMobile ? "100%" : "3.5rem",
              }}
            >
              Privacy Policy
            </a>
          </div>
        </footer>
      </aside>

      {/* Enhanced Responsive Header */}
      <header
        className={`fixed bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-xl text-yellow-100 z-40 shadow-2xl border-b border-yellow-400/20 overflow-hidden
          ${
            screenSize === "xs" || screenSize === "sm"
              ? "left-0 right-0 flex-col px-3 py-2"
              : `flex items-center justify-between right-0 ${getPadding(
                  "medium"
                )}`
          }`}
        style={{
          transition: `all ${getAnimationDuration()}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          top: "0",
          height: isCompactDevice() ? "auto" : getHeaderHeight(),
          minHeight: getHeaderHeight(),
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
        {/* Date Section - Hidden on mobile, show on desktop */}
        {!isCompactDevice() && (
          <section className="flex items-center">
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
        )}

        {/* Enhanced Mobile User Profile - Show on compact devices */}
        {isCompactDevice() && user && (
          <div className="flex items-center justify-between w-full gap-2">
            {/* User Info Section */}
            <div
              className={`flex items-center ${getSpacing("xs")} min-w-0 flex-1`}
            >
              {/* Enhanced Avatar */}
              <div
                className={`flex-shrink-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-black font-bold flex items-center justify-center border-2 border-yellow-300 shadow-md ${
                  isMobileDevice() ? "w-9 h-9 text-sm" : "w-10 h-10 text-base"
                }`}
                style={{
                  minWidth: isMobileDevice() ? 36 : 40,
                  minHeight: isMobileDevice() ? 36 : 40,
                }}
              >
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              {/* Name and Role Badge Only */}
              <div className="flex flex-col items-start min-w-0 flex-1 ml-2">
                <span
                  className={`font-bold bg-gradient-to-r from-yellow-200 to-yellow-300 bg-clip-text text-transparent leading-tight truncate w-full ${getTextSize(
                    "xs"
                  )}`}
                  style={{
                    maxWidth: isMobileDevice() ? "100px" : "140px",
                  }}
                  title={user?.name || user?.email || "User"}
                >
                  {user?.name || user?.email || "User"}
                </span>
                {role && (
                  <span
                    className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-400/30 rounded-full text-yellow-300 text-[9px] font-semibold uppercase tracking-wide w-fit mt-0.5 truncate"
                    style={{
                      maxWidth: isMobileDevice() ? "60px" : "80px",
                    }}
                  >
                    {role === "Owner"
                      ? "Own"
                      : role === "General Manager"
                      ? "GM"
                      : role === "Store Manager"
                      ? "SM"
                      : role === "Assistant Store Manager"
                      ? "ASM"
                      : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Connection Status and Controls */}
            <div className={`flex items-center ${getSpacing("xs")}`}>
              {/* Notification Bell for compact devices */}
              <div className="relative" ref={bellRef}>
                <button
                  className={`relative rounded-xl hover:bg-gradient-to-br hover:from-yellow-400/10 hover:to-yellow-300/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 group ${getPadding(
                    "small"
                  )}`}
                  aria-label="Notifications"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "[Bell Mobile] Clicked! Current state:",
                      bellOpen
                    );
                    setBellOpen(!bellOpen);
                  }}
                >
                  <FaBell
                    className="text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300"
                    size={getIconSize()}
                  />
                  {unreadCount > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse ${
                        isMobileDevice() ? "w-5 h-5 text-xs" : "w-6 h-6 text-xs"
                      }`}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Mobile Notification Dropdown */}
                {bellOpen && (
                  <div
                    className="notification-dropdown-portal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={`absolute right-0 mt-3 bg-gradient-to-br from-black/98 via-gray-900/98 to-black/98 backdrop-blur-xl text-yellow-100 rounded-2xl shadow-2xl z-50 border border-yellow-400/20 ${
                        isMobileDevice()
                          ? "w-80 max-w-[calc(100vw-1rem)]"
                          : "w-72 max-w-[calc(100vw-2rem)]"
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
                      <div
                        className="max-h-64 overflow-y-auto"
                        onClick={() =>
                          console.log(
                            "[CONTAINER] Notification container clicked!"
                          )
                        }
                      >
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

                            // Out of stock - Darkest Red (most urgent)
                            if (
                              type === "out_of_stock" ||
                              msg.includes("out of stock")
                            ) {
                              messageColor = "text-red-600";
                              bgColor =
                                "bg-gradient-to-r from-red-900/25 via-red-800/20 to-transparent border-l-2 border-l-red-500";
                            }
                            // Critical stock - Red (very urgent)
                            else if (
                              type === "critical_stock" ||
                              msg.includes("critical")
                            ) {
                              messageColor = "text-red-500";
                              bgColor =
                                "bg-gradient-to-r from-red-800/18 via-red-700/15 to-transparent border-l-2 border-l-red-400";
                            }
                            // Expired/expiring soon - Orange (urgent)
                            else if (
                              type === "expired" ||
                              type === "expiring" ||
                              type === "expiring_soon" ||
                              msg.includes("expired") ||
                              msg.includes("expiring soon")
                            ) {
                              messageColor = "text-orange-500";
                              bgColor =
                                "bg-gradient-to-r from-orange-800/18 via-orange-700/15 to-transparent border-l-2 border-l-orange-400";
                            }
                            // Low stock - Yellow (warning)
                            else if (
                              type === "low_stock" ||
                              msg.includes("low stock")
                            ) {
                              messageColor = "text-yellow-400";
                              bgColor =
                                "bg-gradient-to-r from-yellow-800/18 via-yellow-700/15 to-transparent border-l-2 border-l-yellow-300";
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
                            // Auto-transfer notifications
                            else if (
                              type === "auto_transfer_surplus" ||
                              type === "auto_transfer_today" ||
                              type === "auto_transfer_master" ||
                              type === "auto_transfer_spoilage" ||
                              msg.includes("auto transfer")
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
                                key={`notification-${n.id}-${n.created_at}`}
                                className={`p-4 border-b border-yellow-400/10 cursor-pointer hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-transparent transition-all duration-300 last:border-b-0 last:rounded-b-2xl ${bgColor} flex items-start gap-3 group`}
                                style={{ pointerEvents: "auto" }}
                                onClick={() => {
                                  console.log(
                                    "[CLICK] Notification item clicked directly!"
                                  );
                                  handleNotificationClick(n);
                                }}
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
                                  onClick={(e) =>
                                    handleRemoveNotification(n, e)
                                  }
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
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Responsive User Profile and Controls - Desktop/Tablet Only */}
        {!isCompactDevice() && (
          <div
            className={`flex items-center ${getSpacing(
              "medium"
            )} min-w-0 flex-shrink-0`}
            style={{
              height: getHeaderHeight(),
              minHeight: getHeaderHeight(),
              maxHeight: getHeaderHeight(),
            }}
          >
            {/* Enhanced Responsive Notification Bell - Desktop/Tablet */}
            <div className="relative" ref={bellRef}>
              <button
                className={`relative rounded-xl hover:bg-gradient-to-br hover:from-yellow-400/10 hover:to-yellow-300/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 group ${getPadding(
                  "small"
                )}`}
                aria-label="Notifications"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const newState = !bellOpen;
                  console.log(
                    "[Bell] Clicked! Current state:",
                    bellOpen,
                    "-> New state:",
                    newState
                  );

                  if (newState && bellRef.current) {
                    const rect = bellRef.current.getBoundingClientRect();
                    setBellPosition({
                      top: rect.bottom + 4, // Reduced gap to 4px for tighter spacing
                      right: window.innerWidth - rect.right,
                    });
                  }

                  setBellOpen(newState);
                }}
              >
                <FaBell
                  className="text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300"
                  size={getIconSize()}
                />
                {unreadCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse ${
                      isDesktopDevice() ? "w-6 h-6 text-sm" : "w-5 h-5 text-xs"
                    }`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {/* Enhanced Responsive Notification Dropdown - Rendered via Portal */}
              {bellOpen &&
                bellPosition &&
                typeof window !== "undefined" &&
                createPortal(
                  <div
                    className="notification-dropdown-portal"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "fixed",
                      top: `${bellPosition.top}px`,
                      right: `${bellPosition.right}px`,
                      zIndex: 99999,
                    }}
                  >
                    <div
                      className={`bg-gradient-to-br from-gray-800 to-gray-900 text-yellow-100 rounded-2xl shadow-2xl border border-yellow-400/20 ${
                        isDesktopDevice()
                          ? "w-96"
                          : isLaptopDevice()
                          ? "w-80"
                          : isTabletDevice()
                          ? "w-72 max-w-[calc(100vw-2rem)]"
                          : isSmallTablet()
                          ? "w-80 max-w-[calc(100vw-2rem)]"
                          : "w-72 max-w-[calc(100vw-1rem)]"
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
                      <div
                        className="max-h-64 overflow-y-auto"
                        onClick={() =>
                          console.log(
                            "[CONTAINER DESKTOP] Notification container clicked!"
                          )
                        }
                      >
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
                            // Auto-transfer notifications
                            else if (
                              type === "auto_transfer_surplus" ||
                              type === "auto_transfer_today" ||
                              type === "auto_transfer_master" ||
                              type === "auto_transfer_spoilage" ||
                              msg.includes("auto transfer")
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
                                key={`notification-${n.id}-${n.created_at}`}
                                className={`p-4 border-b border-yellow-400/10 cursor-pointer hover:bg-gradient-to-r hover:from-yellow-400/5 hover:to-transparent transition-all duration-300 last:border-b-0 last:rounded-b-2xl ${bgColor} flex items-start gap-3 group`}
                                style={{ pointerEvents: "auto" }}
                                onClick={() => {
                                  console.log(
                                    "[CLICK DESKTOP] Notification item clicked directly!"
                                  );
                                  handleNotificationClick(n);
                                }}
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
                                  onClick={(e) =>
                                    handleRemoveNotification(n, e)
                                  }
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
                  </div>,
                  document.body
                )}
            </div>

            {/* Enhanced Responsive User Profile with Avatar */}
            <div
              className={`flex items-center border border-yellow-400/30 rounded-lg bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-xl shadow-lg hover:shadow-xl hover:border-yellow-400/50 transition-all duration-300 min-w-0 group flex-shrink-0 px-3 py-2 gap-2.5`}
              style={{
                maxWidth: "fit-content",
              }}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-black font-bold flex items-center justify-center border-2 border-yellow-300 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 w-9 h-9 text-sm">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : user?.email?.charAt(0).toUpperCase() || "U"}
              </div>

              {/* User Info */}
              <div className="flex flex-col justify-center min-w-0 gap-0.5">
                <span
                  className="font-semibold bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 bg-clip-text text-transparent leading-tight truncate drop-shadow-sm group-hover:from-yellow-100 group-hover:via-yellow-200 group-hover:to-yellow-100 transition-all duration-300 text-sm"
                  style={{
                    lineHeight: "1.2",
                    maxWidth: "140px",
                  }}
                  title={user?.name || "User"}
                >
                  {user?.name || "User"}
                </span>
                {/* Role Badge Only */}
                {role && (
                  <span
                    className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-400/30 rounded-full text-yellow-300 font-semibold uppercase tracking-wide truncate w-fit text-[9px]"
                    style={{
                      maxWidth: "90px",
                    }}
                  >
                    {role === "Owner"
                      ? "Owner"
                      : role === "General Manager"
                      ? "General Manager"
                      : role === "Store Manager"
                      ? "Store Manager"
                      : role === "Assistant Store Manager"
                      ? "Assistant Store Manage"
                      : role}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {notificationModalState && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm z-[101] px-4">
          <section
            className={`bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl w-full p-6 text-left shadow-2xl border border-gray-700/50
        ${isMobile ? "max-w-lg" : "max-w-4xl"}`}
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
                <span
                  className={getNotificationMessageColor(
                    (notificationModalState as any).type
                  )}
                >
                  {notificationModalState.message}
                </span>
              </div>
              {/* Show details for affected items */}
              {parseDetails((notificationModalState as any).details).length >
                0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-1 h-5 rounded-full ${
                        ((notificationModalState as any).type || "").includes(
                          "auto_transfer"
                        ) ||
                        ((notificationModalState as any).type || "").includes(
                          "transfer"
                        )
                          ? "bg-gradient-to-b from-blue-400 to-blue-600"
                          : "bg-gradient-to-b from-yellow-400 to-yellow-600"
                      }`}
                    ></div>
                    <span className="font-bold text-gray-200 text-lg">
                      {((notificationModalState as any).type || "").includes(
                        "auto_transfer"
                      ) ||
                      ((notificationModalState as any).type || "").includes(
                        "transfer"
                      )
                        ? "Transferred Items"
                        : "Affected Items"}
                    </span>
                    <span
                      className={`ml-auto px-3 py-1 text-sm font-semibold rounded-full border ${
                        ((notificationModalState as any).type || "").includes(
                          "auto_transfer"
                        ) ||
                        ((notificationModalState as any).type || "").includes(
                          "transfer"
                        )
                          ? "bg-blue-900/40 text-blue-300 border-blue-400/20"
                          : "bg-yellow-900/40 text-yellow-300 border-yellow-400/20"
                      }`}
                    >
                      {
                        parseDetails((notificationModalState as any).details)
                          .length
                      }{" "}
                      {parseDetails((notificationModalState as any).details)
                        .length === 1
                        ? "Item"
                        : "Items"}
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {parseDetails((notificationModalState as any).details).map(
                      (item: any, idx: number) => (
                        <div
                          key={`${item.item_id || idx}-${item.name || ""}-${
                            item.batch_date || ""
                          }`}
                          className={`bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60 rounded-xl p-4 border border-gray-700/50 transition-all duration-300 shadow-lg ${
                            (
                              (notificationModalState as any).type || ""
                            ).includes("auto_transfer") ||
                            (
                              (notificationModalState as any).type || ""
                            ).includes("transfer")
                              ? "hover:border-blue-400/40 hover:shadow-blue-400/10"
                              : "hover:border-yellow-400/40 hover:shadow-yellow-400/10"
                          }`}
                        >
                          {/* Item Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <h4 className="text-yellow-100 font-bold text-base mb-1">
                                {item.name}
                              </h4>
                              {item.category && (
                                <span className="inline-block px-2.5 py-0.5 bg-blue-900/30 text-blue-300 text-xs font-medium rounded-md border border-blue-400/20">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            {/* Status Badge */}
                            {(item.days_expired !== undefined ||
                              item.days_until_expiry !== undefined ||
                              item.stock_status ||
                              (notificationModalState as any).type ===
                                "low_stock" ||
                              (notificationModalState as any).type ===
                                "critical_stock" ||
                              (notificationModalState as any).type ===
                                "out_of_stock") && (
                              <div
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                  item.stock_status === "OUT OF STOCK"
                                    ? "bg-red-900/40 text-red-300 border-red-400/40"
                                    : item.stock_status === "CRITICAL"
                                    ? "bg-red-900/30 text-red-400 border-red-400/30"
                                    : item.days_expired !== undefined
                                    ? "bg-red-900/30 text-red-300 border-red-400/30"
                                    : item.days_until_expiry !== undefined &&
                                      item.days_until_expiry <= 1
                                    ? "bg-orange-900/30 text-orange-300 border-orange-400/30"
                                    : item.days_until_expiry !== undefined
                                    ? "bg-yellow-900/30 text-yellow-300 border-yellow-400/30"
                                    : item.stock_status === "LOW STOCK"
                                    ? "bg-yellow-900/30 text-yellow-300 border-yellow-400/30"
                                    : "bg-yellow-900/30 text-yellow-300 border-yellow-400/30"
                                }`}
                              >
                                {item.stock_status ||
                                  (item.days_expired !== undefined
                                    ? "EXPIRED"
                                    : item.days_until_expiry !== undefined &&
                                      item.days_until_expiry <= 1
                                    ? "URGENT"
                                    : item.days_until_expiry !== undefined
                                    ? "EXPIRING"
                                    : "LOW STOCK")}
                              </div>
                            )}
                          </div>

                          {/* Item Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Quantity */}
                            {typeof item.quantity !== "undefined" && (
                              <div className="flex items-center gap-2 bg-gray-900/40 rounded-lg px-3 py-2 border border-gray-700/30">
                                <div className="w-8 h-8 rounded-full bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-yellow-400 font-bold text-sm">
                                    📦
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-400 text-xs font-medium">
                                    Quantity
                                  </p>
                                  <p className="text-yellow-100 text-sm font-bold truncate">
                                    {formatQuantity(item.quantity)}{" "}
                                    {item.unit || ""}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Batch Date */}
                            {item.batch_date && (
                              <div className="flex items-center gap-2 bg-gray-900/40 rounded-lg px-3 py-2 border border-gray-700/30">
                                <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-400 font-bold text-sm">
                                    📅
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-400 text-xs font-medium">
                                    Batch Date
                                  </p>
                                  <p className="text-blue-100 text-sm font-bold truncate">
                                    {item.batch_date}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Expiration Date */}
                            {item.expiration_date && (
                              <div
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                                  item.days_expired !== undefined
                                    ? "bg-red-900/20 border-red-700/30"
                                    : item.days_until_expiry !== undefined &&
                                      item.days_until_expiry <= 1
                                    ? "bg-orange-900/20 border-orange-700/30"
                                    : "bg-yellow-900/20 border-yellow-700/30"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    item.days_expired !== undefined
                                      ? "bg-red-900/40"
                                      : item.days_until_expiry !== undefined &&
                                        item.days_until_expiry <= 1
                                      ? "bg-orange-900/40"
                                      : "bg-yellow-900/40"
                                  }`}
                                >
                                  <span
                                    className={`font-bold text-sm ${
                                      item.days_expired !== undefined
                                        ? "text-red-400"
                                        : item.days_until_expiry !==
                                            undefined &&
                                          item.days_until_expiry <= 1
                                        ? "text-orange-400"
                                        : "text-yellow-400"
                                    }`}
                                  >
                                    ⏰
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-400 text-xs font-medium">
                                    Expiration
                                  </p>
                                  <p
                                    className={`text-sm font-bold truncate ${
                                      item.days_expired !== undefined
                                        ? "text-red-300"
                                        : item.days_until_expiry !==
                                            undefined &&
                                          item.days_until_expiry <= 1
                                        ? "text-orange-300"
                                        : "text-yellow-300"
                                    }`}
                                  >
                                    {item.expiration_date}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Days Info */}
                            {(item.days_expired !== undefined ||
                              item.days_until_expiry !== undefined) && (
                              <div
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                                  item.days_expired !== undefined
                                    ? "bg-red-900/20 border-red-700/30"
                                    : "bg-orange-900/20 border-orange-700/30"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    item.days_expired !== undefined
                                      ? "bg-red-900/40"
                                      : "bg-orange-900/40"
                                  }`}
                                >
                                  <span
                                    className={`font-bold text-sm ${
                                      item.days_expired !== undefined
                                        ? "text-red-400"
                                        : "text-orange-400"
                                    }`}
                                  >
                                    ⚠️
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-400 text-xs font-medium">
                                    {item.days_expired !== undefined
                                      ? "Expired"
                                      : "Expires In"}
                                  </p>
                                  <p
                                    className={`text-sm font-bold ${
                                      item.days_expired !== undefined
                                        ? "text-red-300"
                                        : "text-orange-300"
                                    }`}
                                  >
                                    {item.days_expired !== undefined
                                      ? `${item.days_expired} ${
                                          item.days_expired === 1
                                            ? "day"
                                            : "days"
                                        } ago`
                                      : `${item.days_until_expiry} ${
                                          item.days_until_expiry === 1
                                            ? "day"
                                            : "days"
                                        }`}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Source Table */}
                            {item.source_table && (
                              <div className="flex items-center gap-2 bg-gray-900/40 rounded-lg px-3 py-2 border border-gray-700/30 sm:col-span-2">
                                <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-purple-400 font-bold text-sm">
                                    🗄️
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-400 text-xs font-medium">
                                    Source
                                  </p>
                                  <p className="text-purple-100 text-sm font-bold">
                                    {item.source_table === "inventory"
                                      ? "Master Inventory"
                                      : item.source_table === "inventory_today"
                                      ? "Today's Inventory"
                                      : item.source_table ===
                                        "inventory_surplus"
                                      ? "Surplus Inventory"
                                      : item.source_table}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Auto-transfer specific fields */}
                            {item.menu_item && (
                              <div className="flex items-center gap-2 bg-gray-900/40 rounded-lg px-3 py-2 border border-gray-700/30 sm:col-span-2">
                                <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-green-400 font-bold text-sm">
                                    🍽️
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-400 text-xs font-medium">
                                    For Menu Item
                                  </p>
                                  <p className="text-green-100 text-sm font-bold truncate">
                                    {item.menu_item}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Transfer breakdown for auto-transfer notifications */}
                            {(item.from_surplus !== undefined ||
                              item.from_master !== undefined) && (
                              <div className="sm:col-span-2 bg-gray-900/40 rounded-lg px-3 py-2.5 border border-gray-700/30">
                                <p className="text-gray-400 text-xs font-medium mb-2">
                                  Transfer Breakdown
                                </p>
                                <div className="flex gap-3">
                                  {item.from_surplus > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-cyan-400 font-bold text-xs">
                                        📦
                                      </span>
                                      <span className="text-cyan-300 text-sm font-semibold">
                                        {formatQuantity(item.from_surplus)}{" "}
                                        {item.unit || ""} from Surplus
                                      </span>
                                    </div>
                                  )}
                                  {item.from_master > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-indigo-400 font-bold text-xs">
                                        🏪
                                      </span>
                                      <span className="text-indigo-300 text-sm font-semibold">
                                        {formatQuantity(item.from_master)}{" "}
                                        {item.unit || ""} from Master
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Batch Details for Critical/Low Stock items */}
                          {item.batches && item.batches.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700/30">
                              <p className="text-gray-400 text-xs mb-2 font-medium flex items-center gap-2">
                                <span>📦</span>
                                Batch Details ({item.batches.length}{" "}
                                {item.batches.length === 1
                                  ? "batch"
                                  : "batches"}
                                )
                              </p>
                              <div className="space-y-2">
                                {item.batches.map(
                                  (batch: any, batchIdx: number) => (
                                    <div
                                      key={`batch-${batchIdx}`}
                                      className="bg-gray-900/60 rounded-lg px-3 py-2 border border-gray-700/40"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-blue-400 text-xs">
                                            📅
                                          </span>
                                          <span className="text-blue-200 text-sm font-semibold">
                                            {batch.batch_date || "N/A"}
                                          </span>
                                        </div>
                                        <span className="text-yellow-300 text-sm font-bold">
                                          {formatQuantity(batch.quantity)}{" "}
                                          {item.unit}
                                        </span>
                                      </div>
                                      {batch.expiration_date && (
                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                          <span className="text-orange-400">
                                            ⏰
                                          </span>
                                          <span className="text-orange-300">
                                            Expires: {batch.expiration_date}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Reason/Additional Info */}
                          {item.reason && (
                            <div className="mt-3 pt-3 border-t border-gray-700/30">
                              <p className="text-gray-400 text-xs mb-1 font-medium">
                                Reason
                              </p>
                              <p className="text-red-300 text-sm font-semibold">
                                {item.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
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
