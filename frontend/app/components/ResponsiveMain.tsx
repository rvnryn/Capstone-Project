"use client";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";
import { useState, useEffect, useMemo } from "react";

export default function ResponsiveMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  const { isMenuOpen, deviceType, orientation, screenSize } = useNavigation();

  // Calculate dynamic left margin for main content
  // Use the same sidebar width logic as navigation.tsx
  const getSidebarWidth = () => {
    if (screenSize === "xs") return isMenuOpen ? 0 : 0;
    if (screenSize === "sm") return isMenuOpen ? 0 : 0;
    if (screenSize === "md") return isMenuOpen ? 320 : 64;
    if (screenSize === "lg") return isMenuOpen ? 352 : 72;
    if (screenSize === "xl") return isMenuOpen ? 384 : 80;
    if (screenSize === "2xl" || screenSize === "3xl")
      return isMenuOpen ? 416 : 80;
    return isMenuOpen ? 352 : 72;
  };

  const currentMargin = useMemo(() => {
    // On mobile/small screens, sidebar overlays content, so no margin
    if (screenSize === "xs" || screenSize === "sm") return 0;
    return getSidebarWidth();
  }, [screenSize, isMenuOpen]);

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
          minHeight: "100vh",
          marginLeft: currentMargin,
          width:
            screenSize === "xs" || screenSize === "sm"
              ? "100%"
              : `calc(100% - ${currentMargin}px)`,
          minWidth: "0", // Allow shrinking on small screens
          maxWidth: "100vw",
          overflow: "hidden",
          transition:
            "margin-left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {children}
      </div>
    </section>
  );
}
