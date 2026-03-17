import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Badge,
  EmptyState,
  MobileCard,
  SearchInput,
  joinClasses,
} from "../admin/AdminUI";
import { FILTER_BUTTON_CLASS, buildLineRows } from "./reportShared";

export default function ProcessReportPanel({
  logs,
  processes,
  lines,
  search,
  onSearch,
}) {
  const [activityFilter, setActivityFilter] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();

  const allLineData = buildLineRows({ logs, processes, lines });

  const keyword = search.trim().toLowerCase();

  const lineData = allLineData
    .filter((line) => {
      if (!keyword) {
        return true;
      }

      return (
        line.name.toLowerCase().includes(keyword) ||
        line.processes.some((processItem) =>
          processItem.process.toLowerCase().includes(keyword),
        )
      );
    })
    .filter((line) => {
      if (activityFilter === "all") return true;
      const hasActive = line.processes.some(
        (item) => item.activeItems.length > 0,
      );
      const hasNG = line.ngToday > 0;
      if (activityFilter === "active") return hasActive;
      if (activityFilter === "no_ng") return !hasNG;
      if (activityFilter === "has_ng") return hasNG;
      return true;
    });

  const processCounts = {
    all: allLineData.length,
    active: allLineData.filter((line) => line.hasActive).length,
    no_ng: allLineData.filter((line) => line.ngToday === 0).length,
    has_ng: allLineData.filter((line) => line.ngToday > 0).length,
  };

  const processFilters = [
    { id: "all", label: "ทั้งหมด", count: processCounts.all },
    { id: "active", label: "มีงานอยู่", count: processCounts.active },
    { id: "no_ng", label: "ไม่มี NG", count: processCounts.no_ng },
    { id: "has_ng", label: "มี NG", count: processCounts.has_ng },
  ];

  if (lineData.length === 0) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <SearchInput
          placeholder="ค้นหาชื่อสายการผลิตหรือชื่อขั้นตอน"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {processFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActivityFilter(filter.id)}
              className={joinClasses(
                FILTER_BUTTON_CLASS,
                activityFilter === filter.id
                  ? "border-primary-700 bg-primary-600 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
              )}
            >
              {filter.label}: {filter.count}
            </button>
          ))}
        </div>
        <EmptyState
          title={keyword ? "ไม่พบสายการผลิตที่ค้นหา" : "ไม่มีข้อมูลสายการผลิต"}
          description={
            keyword
              ? "ลองเปลี่ยนคำค้น หรือค้นหาด้วยชื่อขั้นตอนอื่น"
              : "ยังไม่พบ line หรือข้อมูลขั้นตอนในระบบรายงาน"
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <SearchInput
        placeholder="ค้นหาชื่อสายการผลิตหรือชื่อขั้นตอน"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {processFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActivityFilter(filter.id)}
            className={joinClasses(
              FILTER_BUTTON_CLASS,
              activityFilter === filter.id
                ? "border-primary-700 bg-primary-600 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
            )}
          >
            {filter.label}: {filter.count}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        {lineData.map((line) => {
          const activeProcesses = line.processes.filter(
            (item) => item.activeItems.length > 0,
          ).length;
          return (
            <MobileCard
              key={line.id}
              className="border-2 border-neutral-200 transition-all hover:border-info-200"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() =>
                  navigate(
                    `/report/line/${encodeURIComponent(line.id)}${location.search}`,
                  )
                }
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-100 text-info-700 sm:h-10 sm:w-10">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-neutral-900 sm:text-lg">
                      {line.name}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      {line.processes.length} ขั้นตอนการผลิต
                    </p>
                  </div>
                  <Badge color={activeProcesses > 0 ? "blue" : "gray"}>
                    กำลังทำ {activeProcesses}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
                  <div className="rounded-2xl border border-success-100 bg-success-50 p-2.5 text-center sm:p-3">
                    <div className="text-xs font-semibold text-success-700">
                      วันนี้เสร็จ (OK)
                    </div>
                    <div className="mt-1 text-xl font-black text-success-700 sm:text-2xl">
                      {line.finishToday}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-danger-100 bg-danger-50 p-2.5 text-center sm:p-3">
                    <div className="text-xs font-semibold text-danger-700">
                      วันนี้เสีย (NG)
                    </div>
                    <div className="mt-1 text-xl font-black text-danger-700 sm:text-2xl">
                      {line.ngToday}
                    </div>
                  </div>
                </div>
              </button>
            </MobileCard>
          );
        })}
      </div>
    </div>
  );
}
