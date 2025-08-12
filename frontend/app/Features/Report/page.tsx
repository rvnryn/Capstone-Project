"use client";

import React from "react";
import NavigationBar from "@/app/components/navigation/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { routes } from "@/app/routes/routes";
import ResponsiveMain from "@/app/components/ResponsiveMain";
import {
  FaChartBar,
  FaBoxes,
  FaUserCheck,
  FaChevronRight,
} from "react-icons/fa";
import { HiDocumentReport } from "react-icons/hi";
import { HiSparkles } from "react-icons/hi";

const Report = () => {
  const router = useRouter();
  const { role } = useAuth();
  const Nav_Sales = () => router.push(routes.salesReport);
  const Nav_Inventory = () => router.push(routes.inventoryReport);
  const Nav_UserActivity = () => router.push(routes.userActivityReport);

  const reportButtons = [
    {
      title: "Sales",
      action: Nav_Sales,
      icon: <FaChartBar className="text-4xl" />,
      description:
        "View and export comprehensive sales performance data and analytics",
      color: "from-black to-gray-900",
      hoverColor: "hover:from-gray-900 hover:to-gray-800",
      badge: "Analytics",
    },
    {
      title: "Inventory",
      action: Nav_Inventory,
      icon: <FaBoxes className="text-4xl" />,
      description:
        "Monitor inventory levels, track stock movements and identify restocking needs",
      color: "from-black to-gray-900",
      hoverColor: "hover:from-gray-900 hover:to-gray-800",
      badge: "Tracking",
    },
    {
      title: "User Activity",
      action: Nav_UserActivity,
      icon: <FaUserCheck className="text-4xl" />,
      description:
        "Track user actions, system activity and monitor access patterns",
      color: "from-black to-gray-900",
      hoverColor: "hover:from-gray-900 hover:to-gray-800",
      badge: "Security",
      role: "Owner",
    },
  ];

  return (
    <section>
      <NavigationBar />
      <ResponsiveMain>
        <main
          className="transition-all duration-300 pb-4 xs:pb-6 sm:pb-8 md:pb-12 pt-20 xs:pt-24 sm:pt-28 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 animate-fadein"
          aria-label="Report main content"
          tabIndex={-1}
        >
          <div className="max-w-full xs:max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full mx-auto w-full">
            {/* Header Section */}
            <section className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl border border-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 2xl:p-12 w-full">
              <div className="text-center mb-4 xs:mb-5 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12">
                <div className="flex flex-col items-center justify-center gap-1 xs:gap-2 sm:gap-3 mb-2 xs:mb-3 sm:mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-400/30 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-orange-400 to-orange-500 p-1.5 xs:p-2 sm:p-3 md:p-4 lg:p-5 rounded-full shadow-lg shadow-orange-400/50">
                      <HiDocumentReport className="text-black text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 xs:gap-2 sm:gap-3">
                    <h1 className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500 bg-clip-text text-transparent font-poppins text-center leading-tight">
                      Reports
                    </h1>
                    <HiSparkles className="text-orange-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl animate-pulse flex-shrink-0" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto leading-relaxed px-1 xs:px-2 sm:px-3 md:px-0 font-medium">
                  Generate comprehensive insights and analytics to drive
                  informed business decisions
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
                {reportButtons
                  .filter((button) => !button.role || button.role === role)
                  .map((button, index) => {
                    // Define colors based on report type
                    const getReportColors = (title: string) => {
                      switch (title) {
                        case "Sales":
                          return {
                            shadow: "hover:shadow-yellow-500/30",
                            border: "border-yellow-400/20",
                            bgPattern: "bg-yellow-400/10",
                            iconBg: "bg-yellow-400/15",
                            iconBorder: "border-yellow-400/30",
                            iconHoverBg: "group-hover:bg-yellow-400/25",
                            iconHoverBorder: "group-hover:border-yellow-400/40",
                            iconText: "text-yellow-400",
                            iconHoverText: "group-hover:text-yellow-200",
                            badgeBg: "bg-yellow-400/20",
                            badgeBorder: "border-yellow-400/40",
                            badgeText: "text-yellow-300",
                            badgeHoverBg: "group-hover:bg-yellow-400/30",
                            badgeHoverText: "group-hover:text-yellow-200",
                            titleHover: "group-hover:text-yellow-200",
                            arrowShadow: "group-hover:shadow-yellow-400/20",
                            hoverOverlay:
                              "group-hover:from-yellow-400/5 group-hover:to-yellow-500/5",
                            animationLine: "via-yellow-400/50",
                          };
                        case "Inventory":
                          return {
                            shadow: "hover:shadow-blue-500/30",
                            border: "border-blue-400/20",
                            bgPattern: "bg-blue-400/10",
                            iconBg: "bg-blue-400/15",
                            iconBorder: "border-blue-400/30",
                            iconHoverBg: "group-hover:bg-blue-400/25",
                            iconHoverBorder: "group-hover:border-blue-400/40",
                            iconText: "text-blue-400",
                            iconHoverText: "group-hover:text-blue-200",
                            badgeBg: "bg-blue-400/20",
                            badgeBorder: "border-blue-400/40",
                            badgeText: "text-blue-300",
                            badgeHoverBg: "group-hover:bg-blue-400/30",
                            badgeHoverText: "group-hover:text-blue-200",
                            titleHover: "group-hover:text-blue-200",
                            arrowShadow: "group-hover:shadow-blue-400/20",
                            hoverOverlay:
                              "group-hover:from-blue-400/5 group-hover:to-blue-500/5",
                            animationLine: "via-blue-400/50",
                          };
                        case "User Activity":
                          return {
                            shadow: "hover:shadow-violet-500/30",
                            border: "border-violet-400/20",
                            bgPattern: "bg-violet-400/10",
                            iconBg: "bg-violet-400/15",
                            iconBorder: "border-violet-400/30",
                            iconHoverBg: "group-hover:bg-violet-400/25",
                            iconHoverBorder: "group-hover:border-violet-400/40",
                            iconText: "text-violet-400",
                            iconHoverText: "group-hover:text-violet-200",
                            badgeBg: "bg-violet-400/20",
                            badgeBorder: "border-violet-400/40",
                            badgeText: "text-violet-300",
                            badgeHoverBg: "group-hover:bg-violet-400/30",
                            badgeHoverText: "group-hover:text-violet-200",
                            titleHover: "group-hover:text-violet-200",
                            arrowShadow: "group-hover:shadow-violet-400/20",
                            hoverOverlay:
                              "group-hover:from-violet-400/5 group-hover:to-violet-500/5",
                            animationLine: "via-violet-400/50",
                          };
                        default:
                          return {
                            shadow: "hover:shadow-orange-500/30",
                            border: "border-orange-400/20",
                            bgPattern: "bg-orange-400/10",
                            iconBg: "bg-orange-400/15",
                            iconBorder: "border-orange-400/30",
                            iconHoverBg: "group-hover:bg-orange-400/25",
                            iconHoverBorder: "group-hover:border-orange-400/40",
                            iconText: "text-orange-400",
                            iconHoverText: "group-hover:text-orange-200",
                            badgeBg: "bg-orange-400/20",
                            badgeBorder: "border-orange-400/40",
                            badgeText: "text-orange-300",
                            badgeHoverBg: "group-hover:bg-orange-400/30",
                            badgeHoverText: "group-hover:text-orange-200",
                            titleHover: "group-hover:text-orange-200",
                            arrowShadow: "group-hover:shadow-orange-400/20",
                            hoverOverlay:
                              "group-hover:from-orange-400/5 group-hover:to-orange-500/5",
                            animationLine: "via-orange-400/50",
                          };
                      }
                    };

                    const colors = getReportColors(button.title);

                    return (
                      <div
                        key={button.title}
                        onClick={button.action}
                        className={`group relative overflow-hidden bg-gradient-to-r ${button.color} ${button.hoverColor} 
                  rounded-lg xs:rounded-xl sm:rounded-2xl cursor-pointer transform hover:scale-[1.01] sm:hover:scale-[1.02] lg:hover:scale-[1.03]
                  transition-all duration-300 ${colors.shadow} ${colors.border}
                  min-h-[90px] xs:min-h-[100px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[160px] xl:min-h-[180px] 
                  touch-manipulation active:scale-[0.98]`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
                        <div className="absolute top-0 right-0 w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 bg-yellow-400/10 rounded-full -translate-y-6 xs:-translate-y-8 sm:-translate-y-10 md:-translate-y-12 lg:-translate-y-14 xl:-translate-y-16 translate-x-6 xs:translate-x-8 sm:translate-x-10 md:translate-x-12 lg:translate-x-14 xl:translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-22 lg:h-22 xl:w-24 xl:h-24 bg-yellow-400/10 rounded-full translate-y-5 xs:translate-y-6 sm:translate-y-8 md:translate-y-10 lg:translate-y-11 xl:translate-y-12 -translate-x-5 xs:-translate-x-6 sm:-translate-x-8 md:-translate-x-10 lg:-translate-x-11 xl:-translate-x-12"></div>

                        {/* Content */}
                        <div className="relative flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-start xl:items-center p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                          {/* Icon Container */}
                          <div className="flex-shrink-0 order-1">
                            <div
                              className={`p-1.5 xs:p-2 sm:p-3 md:p-4 lg:p-3 xl:p-4 ${colors.iconBg} backdrop-blur-sm rounded-md xs:rounded-lg sm:rounded-xl border ${colors.iconBorder} 
                ${colors.iconHoverBg} transition-all duration-300 group-hover:scale-105 sm:group-hover:scale-110 group-hover:shadow-lg ${colors.arrowShadow}`}
                            >
                              <div
                                className={`${colors.iconText} ${colors.iconHoverText} transition-colors duration-300`}
                              >
                                {React.cloneElement(button.icon, {
                                  className:
                                    "text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-2xl xl:text-3xl 2xl:text-4xl",
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Text Content */}
                          <div className="flex-1 min-w-0 order-3 sm:order-2 lg:order-3 xl:order-2">
                            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row sm:items-center lg:items-start xl:items-center gap-1 xs:gap-2 sm:gap-3 lg:gap-2 xl:gap-3 mb-1 xs:mb-2">
                              <h3
                                className={`text-sm xs:text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl 2xl:text-2xl font-bold text-white font-poppins ${colors.titleHover} transition-colors duration-300`}
                              >
                                {button.title}
                              </h3>
                              <span
                                className={`px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 ${colors.badgeBg} backdrop-blur-sm rounded-full text-xs font-semibold ${colors.badgeText} border ${colors.badgeBorder} ${colors.badgeHoverBg} ${colors.badgeHoverText} transition-all duration-300 w-fit`}
                              >
                                {button.badge}
                              </span>
                            </div>
                            <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300 text-xs xs:text-sm sm:text-base lg:text-sm xl:text-base leading-relaxed line-clamp-2 lg:line-clamp-3">
                              {button.description}
                            </p>
                          </div>

                          {/* Arrow Icon */}
                          <div className="flex-shrink-0 order-2 sm:order-3 lg:order-2 xl:order-3 self-end sm:self-center lg:self-end xl:self-center">
                            <div
                              className={`p-1 xs:p-1.5 sm:p-2 md:p-3 lg:p-2 xl:p-3 ${colors.iconBg} backdrop-blur-sm rounded-full border ${colors.iconBorder} 
                      ${colors.iconHoverBg} group-hover:translate-x-1 sm:group-hover:translate-x-2 group-hover:scale-105 sm:group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg ${colors.arrowShadow}`}
                            >
                              <FaChevronRight
                                className={`${colors.iconText} text-xs xs:text-sm sm:text-base md:text-lg lg:text-base xl:text-lg ${colors.iconHoverText} transition-colors duration-300`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Hover Overlay */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent 
                  ${colors.hoverOverlay} transition-all duration-300`}
                        ></div>

                        {/* Subtle Animation Lines */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div
                            className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${colors.animationLine} to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000`}
                          ></div>
                          <div
                            className={`absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-transparent ${colors.animationLine} to-transparent transform translate-x-full group-hover:-translate-x-full transition-transform duration-1000 delay-200`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>
        </main>
      </ResponsiveMain>
    </section>
  );
};

export default Report;
