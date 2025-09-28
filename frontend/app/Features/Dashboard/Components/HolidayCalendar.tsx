"use client";

import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
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

const HolidayCalendar: React.FC<Props> = ({
  holidays,
  onAdd,
  onEdit,
  onDelete,
  year,
}) => {
  // State for PH holidays
  const [phHolidays, setPhHolidays] = useState<HolidayEvent[]>([]);
  useEffect(() => {
    const fetchPH = async () => {
      try {
        const y = year || new Date().getFullYear();
        const res = await axios.get(`/api/holidays/philippines?year=${y}`);
        setPhHolidays(
          (res.data || []).map((h: any) => ({
            id: `ph-${h.date}`,
            date: h.date,
            name: h.name,
            description: "Philippine Holiday",
          }))
        );
      } catch (e) {
        setPhHolidays([]);
      }
    };
    fetchPH();
  }, [year]);
  // Merge custom and PH holidays for calendar
  // Colorblind-friendly palette
  const cbColors = {
    ph: { bg: "#0072B2", border: "#0072B2", text: "#fff", icon: "#E69F00" }, // blue/orange
    custom: { bg: "#CC79A7", border: "#CC79A7", text: "#fff", icon: "#009E73" }, // purple/teal
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
      className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900/95 to-slate-800/90 shadow-2xl h-full flex flex-col overflow-hidden w-full max-w-full min-w-0"
      style={{
        minHeight: "320px",
        height: "100%",
        maxHeight: "480px",
        boxSizing: "border-box",
      }}
      role="region"
      aria-label="Holiday Calendar"
    >
      {/* Header with Legend */}
      <div
        className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-2 xs:p-3 sm:p-4 border-b border-blue-500/20 bg-gradient-to-br from-black/95 to-slate-800 backdrop-blur"
        style={{ boxSizing: "border-box", width: "100%" }}
      >
        <h3 className="text-white font-bold text-xs xs:text-sm sm:text-base flex items-center gap-2">
          <FaCircle className="text-yellow-400 text-xs xs:text-xs sm:text-sm" />
          Events Calendar
        </h3>
        <div className="flex flex-wrap items-center gap-2 xs:gap-3 text-[10px] xs:text-xs sm:text-sm">
          <span className="flex items-center gap-1 text-blue-200">
            <FaCircle className="text-[#E69F00] text-[8px]" />
            <span className="ml-1">PH Holiday</span>
          </span>
          <span className="flex items-center gap-1 text-cyan-200">
            <FaSquare className="text-[#009E73] text-[8px]" />
            <span className="ml-1">Custom Event</span>
          </span>
        </div>
      </div>

      {/* Calendar */}
      <div
        className="flex-1 min-h-[180px] sm:min-h-[260px] md:min-h-[320px] w-full max-w-full overflow-x-auto"
        style={{ boxSizing: "border-box" }}
      >
        <style>{`
        /* Responsive calendar container */
        .fc {
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        /* General text color */
        .fc, 
        .fc .fc-toolbar-title,
        .fc .fc-button,
        .fc .fc-col-header-cell-cushion,
        .fc .fc-daygrid-day-number,
        .fc .fc-daygrid-day,
        .fc .fc-daygrid-day-top,
        .fc .fc-scrollgrid-sync-inner,
        .fc .fc-list-day-cushion,
        .fc .fc-list-event-title {
          color: #f1f5f9 !important; /* slate-100 */
        }

        /* Calendar buttons */
        .fc .fc-button-primary {
          background: #1e293b !important; /* slate-800 */
          border-color: #334155 !important; /* slate-700 */
          color: #f1f5f9 !important;
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

        /* Today highlight */
        .fc .fc-daygrid-day.fc-day-today {
          background: #0f172a !important;
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number::after {
          content: '';
          position: absolute;
          inset: 0;
          margin: auto;
          width: 1.5em;
          height: 1.5em;
          border-radius: 9999px;
          border: 2px solid #facc15;
          background: none;
          box-shadow: 0 0 10px #fbbf2433;
        }

        /* Event text always light */
        .fc-event, 
        .fc-event-title,
        .fc-event-time {
          color: #f1f5f9 !important;
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
        /* Scroll for event overflow on mobile */
        .fc .fc-daygrid-day-events {
          max-height: 2.2em !important;
          overflow-y: auto !important;
          scrollbar-width: thin !important;
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

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height={
            typeof window !== "undefined" && window.innerWidth < 400
              ? 220
              : typeof window !== "undefined" && window.innerWidth < 640
              ? 260
              : 340
          }
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
                className="flex items-center gap-1 group cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-yellow-400"
                tabIndex={0}
                aria-label={
                  isPH
                    ? `PH Holiday: ${arg.event.title}`
                    : `Custom Event: ${arg.event.title}`
                }
                style={{ minWidth: 0, maxWidth: "100%" }}
              >
                {isPH ? (
                  <FaCircle className="text-[#E69F00] text-[8px]" />
                ) : (
                  <FaSquare className="text-[#009E73] text-[8px]" />
                )}
                <span
                  className={`font-semibold text-[9px] xs:text-[10px] sm:text-xs truncate ${
                    isPH ? "text-blue-100" : "text-purple-100"
                  }`}
                  style={{
                    textShadow: "0 1px 2px #000",
                    minWidth: 0,
                    maxWidth: "100%",
                  }}
                >
                  {arg.event.title}
                </span>
                {/* Tooltip */}
                <div
                  className="absolute z-50 hidden group-hover:flex group-focus:flex flex-col bg-gradient-to-br from-black/95 to-slate-800
                           text-white text-xs rounded-lg px-2 xs:px-3 py-2 shadow-xl border border-blue-700 
                           top-full left-0 mt-2 w-max min-w-[120px] xs:min-w-[160px] sm:min-w-[180px] max-w-[180px] xs:max-w-[220px] sm:max-w-[240px]"
                  role="tooltip"
                  style={{ wordBreak: "break-word", pointerEvents: "auto" }}
                >
                  <div className="font-bold text-yellow-300">
                    {arg.event.title}
                  </div>
                  {arg.event.extendedProps.description && (
                    <div className="text-slate-300">
                      {arg.event.extendedProps.description}
                    </div>
                  )}
                  <div className="text-blue-300">
                    {isPH
                      ? "🇵🇭 PH Holiday (colorblind safe)"
                      : "✨ Custom Event (colorblind safe)"}
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
            "rounded-full px-1.5 xs:px-2 py-0.5 sm:py-1 text-[9px] xs:text-[10px] sm:text-xs font-semibold shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400",
            arg.event.extendedProps.isPH
              ? "bg-[#0072B2] text-white border-[#E69F00]"
              : "bg-[#CC79A7] text-white border-[#009E73]",
          ]}
        />
      </div>
    </div>
  );
};

export default HolidayCalendar;
