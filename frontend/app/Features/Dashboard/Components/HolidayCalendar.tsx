"use client";

import React, { useState, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createPortal } from "react-dom";
import { FaCircle, FaSquare } from "react-icons/fa";

export interface HolidayEvent {
  id: number | string;
  date: string; // YYYY-MM-DD
  name: string;
  description?: string;
}

interface Props {
  holidays: HolidayEvent[];
  onAdd?: (date: string) => void;
  onEdit?: (holiday: HolidayEvent) => void;
  onDelete?: (holiday: HolidayEvent) => void;
  year?: number; // Optionally specify year for PH holidays
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const HolidayCalendar: React.FC<Props> = ({
  holidays,
  onAdd,
  onEdit,
  onDelete,
  year,
}) => {
  // State for PH holidays
  const [phHolidays, setPhHolidays] = useState<HolidayEvent[]>([]);
  const [phHolidaysLoading, setPhHolidaysLoading] = useState(false);
  const [phHolidaysError, setPhHolidaysError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPH = async () => {
      try {
        setPhHolidaysLoading(true);
        setPhHolidaysError(null);

        const y = year || new Date().getFullYear();
        const url = `${API_BASE_URL}/api/philippines?year=${y}`;
        const response = await fetch(url);
        console.log("PH Holidays API URL:", url);

        if (!response.ok) {
          throw new Error(`Failed to fetch PH holidays: ${response.status}`);
        }

        const data = await response.json();
        console.log("PH Holidays API response:", data);

        const holidays = (data || []).map((h: any) => ({
          id: `ph-${h.date}`,
          date: h.date,
          name: h.name,
          description: h.type === "official" ? "Philippine Holiday" : h.name,
        }));

        setPhHolidays(holidays);

        // Cache successful response
        localStorage.setItem(
          `cached_ph_holidays_${y}`,
          JSON.stringify(holidays)
        );
      } catch (e) {
        console.log("PH Holidays API error - trying cached data:", e);
        setPhHolidaysError(
          e instanceof Error ? e.message : "Failed to fetch PH holidays"
        );

        // Try to load from cache
        const y = year || new Date().getFullYear();
        const cached = localStorage.getItem(`cached_ph_holidays_${y}`);
        if (cached) {
          try {
            const cachedHolidays = JSON.parse(cached);
            setPhHolidays(cachedHolidays);
            console.log("Using cached PH holidays data");
          } catch (cacheError) {
            console.error("Failed to parse cached PH holidays:", cacheError);
            setPhHolidays([]);
          }
        } else {
          setPhHolidays([]);
        }
      } finally {
        setPhHolidaysLoading(false);
      }
    };
    fetchPH();
  }, [year]);
  // Merge custom and PH holidays for calendar
  // Colorblind-friendly palette, now with solid backgrounds for readability
  const cbColors = {
    ph: {
      bg: "#0072B2",
      border: "#E69F00",
      text: "#fff",
      emoji: "🇵🇭",
      badge: "PH",
    },
    custom: {
      bg: "#CC79A7",
      border: "#009E73",
      text: "#fff",
      emoji: "✨",
      badge: "Custom",
    },
  };
  const events = useMemo(
    () =>
      [...holidays, ...phHolidays].map((h) => {
        const isPH = String(h.id).startsWith("ph-");
        const color = isPH ? cbColors.ph : cbColors.custom;
        return {
          id: String(h.id),
          title: h.name,
          start: h.date,
          allDay: true,
          extendedProps: {
            description: h.description,
            isPH,
          },
          backgroundColor: color.bg,
          borderColor: color.border,
          textColor: color.text,
        };
      }),
    [holidays, phHolidays]
  );

  // Handle date click for adding new holiday
  const handleDateClick = (arg: any) => {
    if (onAdd) onAdd(arg.dateStr);
  };

  // Handle event click for editing/deleting
  const handleEventClick = (arg: any) => {
    if (onEdit) {
      // Find the holiday by id (from either holidays or phHolidays)
      const holiday =
        holidays.find((h) => String(h.id) === arg.event.id) ||
        phHolidays.find((h) => String(h.id) === arg.event.id);
      if (holiday) onEdit(holiday);
    }
  };

  return (
    <div
      className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900/95 to-slate-800/90 shadow-2xl flex flex-col w-full max-w-full min-w-0 responsive-calendar-container"
      style={{
        minHeight: "600px",
        height: "100%",
        maxHeight: "200vh",
        boxSizing: "border-box",
      }}
      role="region"
      aria-label="Holiday Calendar"
    >
      {/* Header with Legend */}
      <header className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-2 xs:p-3 sm:p-4 border-b border-blue-700/30 bg-black/60 rounded-t-2xl responsive-calendar-header">
        <div className="flex items-center gap-2">
          <span className="text-lg xs:text-xl sm:text-2xl">📅</span>
          <div>
            <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-white">
              Holiday Calendar
            </h2>
            <p className="text-xs xs:text-sm text-gray-400">
              Official & Custom Events
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 xs:gap-2 text-[10px] xs:text-xs sm:text-sm">
          <div className="flex items-center gap-1 bg-blue-800/30 px-1.5 py-0.5 xs:px-2 xs:py-1 rounded-lg">
            <span>🇵🇭</span>
            <span className="text-blue-300 font-medium">PH Holiday</span>
            {phHolidaysLoading && (
              <span className="text-yellow-400 ml-1">(Loading)</span>
            )}
            {phHolidaysError && (
              <span className="text-red-400 ml-1">(Offline)</span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-pink-800/30 px-1.5 py-0.5 xs:px-2 xs:py-1 rounded-lg">
            <span>✨</span>
            <span className="text-pink-300 font-medium">Custom Event</span>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full responsive-calendar-content">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="100%"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right:
              typeof window !== "undefined" && window.innerWidth < 400
                ? ""
                : typeof window !== "undefined" && window.innerWidth < 640
                ? ""
                : "dayGridMonth,dayGridWeek,dayGridDay",
          }}
          dayMaxEventRows={
            typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2
          }
          eventContent={(arg) => {
            const isPH = arg.event.extendedProps.isPH;
            const color = isPH ? cbColors.ph : cbColors.custom;
            return (
              <div
                className="flex items-center gap-1 group cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-yellow-400 responsive-event-pill"
                tabIndex={0}
                aria-label={
                  isPH
                    ? `PH Holiday: ${arg.event.title}`
                    : `Custom Event: ${arg.event.title}`
                }
                style={{
                  minWidth: 0,
                  maxWidth: "100%",
                  border: `2px ${isPH ? "solid" : "dashed"} ${color.border}`,
                  background: color.bg,
                  borderRadius: 8,
                  padding: "2px 6px",
                  boxShadow: isPH
                    ? "0 0 0 2px #E69F00 inset"
                    : "0 0 0 2px #009E73 inset",
                }}
              >
                <span
                  className="font-semibold text-[9px] xs:text-[10px] sm:text-xs md:text-sm truncate text-white responsive-event-title"
                  style={{
                    color: "#fff",
                    textShadow: "0 1px 2px #000",
                    minWidth: 0,
                    maxWidth: "100%",
                  }}
                >
                  {arg.event.title}
                </span>
                <span
                  className={`ml-1 px-1 rounded text-[9px] font-bold uppercase responsive-event-badge ${
                    isPH
                      ? "bg-[#0072B2] text-white border border-[#E69F00]"
                      : "bg-[#CC79A7] text-white border border-[#009E73]"
                  }`}
                >
                  {color.badge}
                </span>
                {/* Tooltip */}
                <div
                  className="absolute z-50 hidden group-hover:flex group-focus:flex flex-col bg-gradient-to-br from-black/95 to-slate-800 text-white text-xs rounded-lg px-2 xs:px-3 py-2 shadow-xl border border-blue-700 top-full left-0 mt-2 w-max min-w-[120px] xs:min-w-[160px] sm:min-w-[180px] max-w-[180px] xs:max-w-[220px] sm:max-w-[240px] responsive-event-tooltip"
                  role="tooltip"
                  style={{ wordBreak: "break-word", pointerEvents: "auto" }}
                >
                  <div className="font-bold text-yellow-300 flex items-center gap-1">
                    <span
                      role="img"
                      aria-label={isPH ? "PH Holiday" : "Custom Event"}
                    >
                      {color.emoji}
                    </span>
                    {arg.event.title}
                    <span
                      className={`ml-1 px-1 rounded text-[9px] font-bold uppercase ${
                        isPH
                          ? "bg-[#0072B2] text-white border border-[#E69F00]"
                          : "bg-[#CC79A7] text-white border border-[#009E73]"
                      }`}
                    >
                      {color.badge}
                    </span>
                  </div>
                  {arg.event.extendedProps.description && (
                    <div className="text-white">
                      {arg.event.extendedProps.description}
                    </div>
                  )}
                  <div className="text-blue-300">
                    {isPH
                      ? "PH Holiday (colorblind safe palette, 🇵🇭 icon, solid border, blue/orange)"
                      : "Custom Event (colorblind safe palette, ✨ icon, dashed border, purple/teal)"}
                  </div>
                  <div className="text-slate-400 mt-1">
                    {arg.event.start?.toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          }}
          dayCellClassNames={() =>
            "!rounded-lg !bg-slate-900/70 hover:!bg-slate-800 transition-colors duration-150 border border-blue-900/30"
          }
          eventClassNames={(arg) => [
            "rounded-full px-1.5 xs:px-2 py-0.5 sm:py-1 text-[9px] xs:text-[10px] sm:text-xs font-semibold shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400 responsive-event-class",
            arg.event.extendedProps.isPH
              ? "bg-[#0072B2] text-white border-[#E69F00]"
              : "bg-[#CC79A7] text-white border-[#009E73]",
          ]}
        />
      </div>

      <style>{`
        /* Responsive calendar container */
        .responsive-calendar-container {
          min-width: 0;
          width: 100%;
          max-width: 100vw;
        }
        .responsive-calendar-header {
          flex-wrap: wrap;
        }

        /* Responsive event pill */
        .responsive-event-pill {
          font-size: 0.7rem;
          padding: 2px 6px;
        }
        @media (min-width: 400px) {
          .responsive-event-pill {
            font-size: 0.8rem;
            padding: 3px 8px;
          }
        }
        @media (min-width: 640px) {
          .responsive-event-pill {
            font-size: 0.95rem;
            padding: 4px 12px;
          }
        }
        .responsive-event-title {
          font-size: 0.7rem;
        }
        @media (min-width: 400px) {
          .responsive-event-title {
            font-size: 0.8rem;
          }
        }
        @media (min-width: 640px) {
          .responsive-event-title {
            font-size: 0.95rem;
          }
        }
        .responsive-event-badge {
          font-size: 0.65rem;
        }
        @media (min-width: 400px) {
          .responsive-event-badge {
            font-size: 0.75rem;
          }
        }
        @media (min-width: 640px) {
          .responsive-event-badge {
            font-size: 0.85rem;
          }
        }
        .responsive-event-tooltip {
          font-size: 0.7rem;
          min-width: 120px;
          max-width: 180px;
        }
        @media (min-width: 400px) {
          .responsive-event-tooltip {
            font-size: 0.8rem;
            min-width: 160px;
            max-width: 220px;
          }
        }
        @media (min-width: 640px) {
          .responsive-event-tooltip {
            font-size: 0.95rem;
            min-width: 180px;
            max-width: 240px;
          }
        }
        /* Make all text inside the calendar white */
        .fc,
        .fc .fc-toolbar-title,
        .fc .fc-button,
        .fc .fc-col-header-cell-cushion,
        .fc .fc-daygrid-day-number,
        .fc .fc-daygrid-day,
        .fc .fc-daygrid-day-top,
        // .fc .fc-scrollgrid-sync-inner,
        .fc .fc-list-day-cushion,
        .fc .fc-list-event-title {
          color: #ffffff !important;
        }

        /* Calendar buttons */
        .fc .fc-button-primary {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #ffffff !important;
          border-radius: 9999px !important;
          padding: 0.25rem 0.7rem !important;
          font-weight: 600 !important;
          font-size: 0.7rem !important;
        }
        @media (min-width: 400px) {
          .fc .fc-button-primary {
            font-size: 0.8rem !important;
            padding: 0.3rem 0.8rem !important;
          }
        }
        @media (min-width: 640px) {
          .fc .fc-button-primary {
            font-size: 0.9rem !important;
            padding: 0.4rem 1rem !important;
          }
        }
        .fc .fc-button-primary:not(:disabled):hover {
          background: #334155 !important;
          color: #fff !important;
        }
        .fc .fc-button-active {
          background: #facc15 !important;
          color: #000 !important;
        }

        /* Calendar toolbar (month title and arrows) */
        .fc-toolbar-chunk {
          color: #ffffff !important;
        }

        /* Today's cell outline - HIGH VISIBILITY */
        .fc-day-today {
          background-color: rgba(250, 204, 21, 0.18) !important;
          border: 2.5px solid #FFD700 !important;
          box-shadow: 0 0 0 2px #FFD700, 0 0 8px 2px #facc15cc !important;
          border-radius: 10px !important;
          z-index: 2;
        }

        /* Event title text */
        .fc-event-title,
        .fc-event-time {
          color: #ffffff !important;
        }

        /* Day numbers */
        .fc-daygrid-day-number {
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        /* Responsive tweaks for smallest screens */
        @media (max-width: 700px) {
          .fc .fc-toolbar {
            flex-wrap: wrap !important;
            gap: 0.2rem !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .fc .fc-toolbar-chunk {
            flex-basis: 100% !important;
            justify-content: center !important;
            margin-bottom: 0.1rem !important;
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 0.2rem !important;
          }
          .fc .fc-toolbar .fc-toolbar-chunk:last-child {
            display: none !important; /* Hide view switch on smallest screens */
          }
          .fc .fc-toolbar-title {
            font-size: 0.85rem !important;
            text-align: center !important;
            width: 100% !important;
            margin-bottom: 0.1rem !important;
          }
          .fc .fc-button-primary {
            font-size: 0.65rem !important;
            padding: 0.18rem 0.5rem !important;
            min-width: 2.2rem !important;
            min-height: 1.7rem !important;
          }
          .fc .fc-col-header-cell-cushion, .fc .fc-daygrid-day-number {
            font-size: 0.7rem !important;
          }
          .fc .fc-daygrid, .fc .fc-scrollgrid, .fc .fc-daygrid-body, .fc .fc-daygrid-day, .fc .fc-daygrid-day-frame, .fc .fc-daygrid-day-events, .fc .fc-scrollgrid-sync-table {
            min-width: 0 !important;
            padding: 0 !important;
          }
          .fc .fc-daygrid-day {
            min-width: 44px !important;
            min-height: 44px !important;
          }
        }
        @media (max-width: 400px) {
          .fc .fc-toolbar-title {
            font-size: 0.7rem !important;
          }
          .fc .fc-button-primary {
            font-size: 0.55rem !important;
            padding: 0.12rem 0.3rem !important;
            min-width: 1.7rem !important;
            min-height: 1.3rem !important;
          }
          .fc .fc-col-header-cell-cushion, .fc .fc-daygrid-day-number {
            font-size: 0.6rem !important;
          }
        }
        /* Smooth transitions for hover/focus */
        .fc-event, .fc-daygrid-day {
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }
        /* Touch-friendly tooltips */
        .fc-event .group-hover\:flex, .fc-event .group-focus\:flex {
          display: flex !important;
        }
      `}</style>
    </div>
  );
};

export default HolidayCalendar;
