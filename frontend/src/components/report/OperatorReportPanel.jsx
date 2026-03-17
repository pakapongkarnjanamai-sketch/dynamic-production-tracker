import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  EmptyState,
  MobileCard,
  SearchInput,
  joinClasses,
} from "../admin/AdminUI";
import { FILTER_BUTTON_CLASS, buildOperatorRows } from "./reportShared";

export default function OperatorReportPanel({ logs, search, onSearch }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();

  const keyword = search.trim().toLowerCase();
  const allRows = buildOperatorRows(logs);

  const operatorCounts = {
    all: allRows.length,
    working: allRows.filter((row) => row.currentTask).length,
    idle: allRows.filter((row) => !row.currentTask).length,
    has_ng: allRows.filter((row) => row.ng > 0).length,
  };

  const operatorFilters = [
    { id: "all", label: "ทั้งหมด", count: operatorCounts.all },
    { id: "working", label: "กำลังทำ", count: operatorCounts.working },
    { id: "idle", label: "ว่าง", count: operatorCounts.idle },
    { id: "has_ng", label: "มี NG", count: operatorCounts.has_ng },
  ];

  const rows = allRows
    .filter((row) => {
      if (!keyword) {
        return true;
      }

      return (
        row.name.toLowerCase().includes(keyword) ||
        row.history.some(
          (historyItem) =>
            historyItem.process_name.toLowerCase().includes(keyword) ||
            historyItem.qr_code.toLowerCase().includes(keyword),
        )
      );
    })
    .filter((row) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "working") return !!row.currentTask;
      if (statusFilter === "idle") return !row.currentTask;
      if (statusFilter === "has_ng") return row.ng > 0;
      return true;
    });

  if (rows.length === 0) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <SearchInput
          placeholder="ค้นหาชื่อผู้ปฏิบัติงาน, ขั้นตอน หรือ QR Code"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {operatorFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={joinClasses(
                FILTER_BUTTON_CLASS,
                statusFilter === filter.id
                  ? "border-primary-700 bg-primary-600 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
              )}
            >
              {filter.label}: {filter.count}
            </button>
          ))}
        </div>
        <EmptyState
          title={
            keyword
              ? "ไม่พบผู้ปฏิบัติงานที่ค้นหา"
              : "ยังไม่มีประวัติการทำงานของผู้ปฏิบัติงาน"
          }
          description={
            keyword
              ? "ลองเปลี่ยนคำค้น หรือค้นหาด้วยชื่อขั้นตอน/รหัสงาน"
              : "ระบบยังไม่พบข้อมูลกิจกรรมของ operator"
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <SearchInput
        placeholder="ค้นหาชื่อผู้ปฏิบัติงาน, ขั้นตอน หรือ QR Code"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {operatorFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatusFilter(filter.id)}
            className={joinClasses(
              FILTER_BUTTON_CLASS,
              statusFilter === filter.id
                ? "border-primary-700 bg-primary-600 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
            )}
          >
            {filter.label}: {filter.count}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          return (
            <MobileCard
              key={row.name}
              className="cursor-pointer border-2 border-neutral-200 transition-all hover:border-success-200"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() =>
                  navigate(
                    `/report/operator/${encodeURIComponent(row.name)}${location.search}`,
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-success-200 bg-success-100 text-base font-bold text-success-700 sm:h-12 sm:w-12 sm:text-lg">
                    {row.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-bold text-neutral-900 sm:text-lg">
                      {row.name}
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-neutral-200 pt-2.5 sm:mt-4 sm:pt-3">
                  {row.currentTask ? (
                    <>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-info-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-info-700">
                          กำลังทำอยู่
                        </span>
                      </div>
                      <div className="truncate text-sm font-bold text-neutral-900">
                        {row.currentTask.process_name}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-medium text-neutral-400">
                      ว่าง
                    </div>
                  )}
                </div>
              </button>
            </MobileCard>
          );
        })}
      </div>
    </div>
  );
}
