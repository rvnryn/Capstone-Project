/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback } from "react"

// Enhanced breakpoints for better responsive handling across all devices
const BREAKPOINTS = {
  xs: 0,     // Extra small devices (portrait phones)
  sm: 480,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (laptops)
  xl: 1280,  // Extra large devices (desktops)
  "2xl": 1536, // 2X large devices (large desktops)
  "3xl": 1920, // 3X large devices (4K displays)
} as const

type ScreenSize = keyof typeof BREAKPOINTS
type DeviceType = "mobile" | "tablet" | "desktop" | "tv"
type Orientation = "portrait" | "landscape"

interface NavigationState {
  isMenuOpen: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenSize: ScreenSize
  deviceType: DeviceType
  orientation: Orientation
  viewportWidth: number
  viewportHeight: number
  isPWA: boolean
  isOnline: boolean
  reducedMotion: boolean
  highContrast: boolean
}

export function useNavigation(): NavigationState & {
  setIsMenuOpen: (open: boolean) => void
  toggleMenu: () => void
  closeMenu: () => void
  openMenu: () => void
} {
  // Initialize state with safe defaults
  const [state, setState] = useState<NavigationState>(() => {
    const defaultState: NavigationState = {
      isMenuOpen: true,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      screenSize: "lg",
      deviceType: "desktop",
      orientation: "landscape",
      viewportWidth: 1024,
      viewportHeight: 768,
      isPWA: false,
      isOnline: true,
      reducedMotion: false,
      highContrast: false,
    }

    // Only access localStorage on client side
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen")
      defaultState.isMenuOpen = saved ? JSON.parse(saved) : true
    }

    return defaultState
  })

  // Detect screen size category
  const getScreenSize = useCallback((width: number): ScreenSize => {
    if (width < BREAKPOINTS.sm) return "xs"
    if (width < BREAKPOINTS.md) return "sm"
    if (width < BREAKPOINTS.lg) return "md"
    if (width < BREAKPOINTS.xl) return "lg"
    if (width < BREAKPOINTS["2xl"]) return "xl"
    if (width < BREAKPOINTS["3xl"]) return "2xl"
    return "3xl"
  }, [])

  // Detect device type based on screen size and capabilities
  const getDeviceType = useCallback((width: number, height: number, isTouchDevice: boolean): DeviceType => {
    if (width < BREAKPOINTS.md) return "mobile"
    if (width < BREAKPOINTS.lg && isTouchDevice) return "tablet"
    if (width >= BREAKPOINTS["3xl"]) return "tv"
    return "desktop"
  }, [])

  // Detect if device supports touch
  const getTouchSupport = useCallback((): boolean => {
    if (typeof window === "undefined") return false
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    )
  }, [])

  // Detect PWA mode
  const getPWAMode = useCallback((): boolean => {
    if (typeof window === "undefined") return false
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://")
    )
  }, [])

  // Detect accessibility preferences
  const getAccessibilityPreferences = useCallback(() => {
    if (typeof window === "undefined") {
      return { reducedMotion: false, highContrast: false }
    }

    return {
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      highContrast: window.matchMedia("(prefers-contrast: high)").matches,
    }
  }, [])

  // Main resize handler
  const updateNavigationState = useCallback(() => {
    if (typeof window === "undefined") return

    const width = window.innerWidth
    const height = window.innerHeight
    const isTouchDevice = getTouchSupport()
    const screenSize = getScreenSize(width)
    const deviceType = getDeviceType(width, height, isTouchDevice)
    const orientation: Orientation = width > height ? "landscape" : "portrait"
    const isPWA = getPWAMode()
    const { reducedMotion, highContrast } = getAccessibilityPreferences()

    // Determine mobile/tablet/desktop states
    const isMobile = deviceType === "mobile"
    const isTablet = deviceType === "tablet"
    const isDesktop = deviceType === "desktop" || deviceType === "tv"

    setState(prevState => ({
      ...prevState,
      viewportWidth: width,
      viewportHeight: height,
      screenSize,
      deviceType,
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      orientation,
      isPWA,
      reducedMotion,
      highContrast,
      // Auto-manage menu state based on device type
      isMenuOpen: prevState.isMenuOpen && !isMobile, // Close on mobile, preserve on desktop
    }))
  }, [getScreenSize, getDeviceType, getTouchSupport, getPWAMode, getAccessibilityPreferences])

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return

    const updateOnlineStatus = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }))
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)
    updateOnlineStatus()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  // Handle resize and orientation changes
  useEffect(() => {
    if (typeof window === "undefined") return

    updateNavigationState()

    // Debounced resize handler for better performance
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateNavigationState, 150)
    }

    // Handle both resize and orientation change
    window.addEventListener("resize", debouncedResize)
    window.addEventListener("orientationchange", debouncedResize)
    
    // Listen for custom events from NavigationBar component
    const handleNavToggle = (e: CustomEvent) => {
      setState(prev => ({ ...prev, isMenuOpen: e.detail.isOpen }))
    }
    window.addEventListener("nav-toggle" as any, handleNavToggle)

    // Handle media query changes for accessibility
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)")
    
    const handleMediaChange = () => {
      const { reducedMotion, highContrast } = getAccessibilityPreferences()
      setState(prev => ({ ...prev, reducedMotion, highContrast }))
    }

    reducedMotionQuery.addEventListener("change", handleMediaChange)
    highContrastQuery.addEventListener("change", handleMediaChange)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", debouncedResize)
      window.removeEventListener("orientationchange", debouncedResize)
      window.removeEventListener("nav-toggle" as any, handleNavToggle)
      reducedMotionQuery.removeEventListener("change", handleMediaChange)
      highContrastQuery.removeEventListener("change", handleMediaChange)
    }
  }, [updateNavigationState, getAccessibilityPreferences])

  // Persist sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", JSON.stringify(state.isMenuOpen))
    }
  }, [state.isMenuOpen])

  // Menu control functions
  const setIsMenuOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isMenuOpen: open }));
    // Dispatch custom event to notify other components (async to avoid render conflicts)
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nav-toggle', { detail: { isOpen: open } }));
      }, 0);
    }
  }, [])

  const toggleMenu = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, isMenuOpen: !prev.isMenuOpen };
      // Dispatch custom event with new state (async)
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('nav-toggle', { detail: { isOpen: newState.isMenuOpen } }));
        }, 0);
      }
      return newState;
    });
  }, [])

  const closeMenu = useCallback(() => {
    setState(prev => ({ ...prev, isMenuOpen: false }));
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nav-toggle', { detail: { isOpen: false } }));
      }, 0);
    }
  }, [])

  const openMenu = useCallback(() => {
    setState(prev => ({ ...prev, isMenuOpen: true }));
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nav-toggle', { detail: { isOpen: true } }));
      }, 0);
    }
  }, [])

  return {
    ...state,
    setIsMenuOpen,
    toggleMenu,
    closeMenu,
    openMenu,
  }
}

// Export types for use in other components
export type { NavigationState, ScreenSize, DeviceType, Orientation }

// Export utility functions for use in components
export const navigationUtils = {
  // Check if screen size is at least a certain breakpoint
  isAtLeast: (currentSize: ScreenSize, targetSize: ScreenSize): boolean => {
    return BREAKPOINTS[currentSize] >= BREAKPOINTS[targetSize]
  },
  
  // Check if screen size is at most a certain breakpoint
  isAtMost: (currentSize: ScreenSize, targetSize: ScreenSize): boolean => {
    return BREAKPOINTS[currentSize] <= BREAKPOINTS[targetSize]
  },
  
  // Get responsive class based on screen size
  getResponsiveClass: (classes: Partial<Record<ScreenSize, string>>, currentSize: ScreenSize): string => {
    return classes[currentSize] || classes.lg || ""
  },
  
  // Check if device capabilities support certain features
  supportsHover: (deviceType: DeviceType): boolean => {
    return deviceType === "desktop" || deviceType === "tv"
  },
  
  // Get appropriate animation duration based on reduced motion preference
  getAnimationDuration: (reducedMotion: boolean, normalDuration = 300): number => {
    return reducedMotion ? 0 : normalDuration
  },
}
