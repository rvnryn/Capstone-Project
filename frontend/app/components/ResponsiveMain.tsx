"use client";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useState, useEffect, useMemo } from "react";

export default function ResponsiveMain({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const {
    isMenuOpen,
    deviceType,
    orientation,
    screenSize,
  } = useNavigation();

  // Calculate dynamic left margin for main content
  const currentMargin = useMemo(() => {
    // On mobile/small screens, no margin - sidebar overlays content
    if (deviceType === "mobile" || screenSize === "xs" || screenSize === "sm") return 0;
    
    // On larger screens, margin adjusts for sidebar
    if (deviceType === "tablet" && orientation === "portrait") return isMenuOpen ? 320 : 64;
    if (screenSize === "md") return isMenuOpen ? 256 : 64;
    if (screenSize === "lg") return isMenuOpen ? 288 : 80;
    if (screenSize === "xl" || screenSize === "2xl" || screenSize === "3xl") return isMenuOpen ? 320 : 96;
    return isMenuOpen ? 288 : 80;
  }, [deviceType, screenSize, orientation, isMenuOpen]);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  // Prevent hydration mismatch by not rendering responsive layout until mounted
  if (!mounted) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700">
        <div className="min-h-screen">{children}</div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700">
      <div
        id="main-content-wrapper"
        style={{
          minHeight: '100vh',
          marginLeft: currentMargin,
          width: `calc(100% - ${currentMargin}px)`,
          minWidth: '320px', // Ensure minimum usable width
          maxWidth: '100vw', // Prevent horizontal overflow
          overflow: 'hidden', // Prevent content overflow
        }}
      >
        {children}
      </div>
    </section>
  );
}
