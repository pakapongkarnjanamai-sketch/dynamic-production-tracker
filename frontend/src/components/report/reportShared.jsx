export const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  on_hold: "หยุดพัก / รอแก้ไข",
};

export const ACTION_LABELS = {
  start: "เริ่มงาน",
  finish: "เสร็จสิ้น (OK)",
  ng: "ของเสีย (NG)",
};

export const STATUS_BADGE_COLORS = {
  pending: "gray",
  in_progress: "amber",
  completed: "green",
  on_hold: "red",
};

export const ACTION_BADGE_COLORS = {
  start: "blue",
  finish: "green",
  ng: "red",
};

export const TABS = [
  {
    id: "trays",
    label: "งาน",
    shortLabel: "งาน",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    id: "processes",
    label: "สายการผลิต",
    shortLabel: "ไลน์",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    id: "operators",
    label: "ผู้ปฏิบัติงาน",
    shortLabel: "ทีม",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export const DEFAULT_REPORT_TAB = "trays";

export const FILTER_BUTTON_CLASS =
  "shrink-0 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold transition-colors";

export function getValidReportTab(value) {
  return TABS.some((tab) => tab.id === value) ? value : DEFAULT_REPORT_TAB;
}

export function createReportSearch({ tab = DEFAULT_REPORT_TAB, search = "" }) {
  const params = new URLSearchParams();
  params.set("tab", getValidReportTab(tab));

  const normalizedSearch = search.trim();
  if (normalizedSearch) {
    params.set("search", normalizedSearch);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getOperatorName(log) {
  return log.operator || "ไม่ระบุชื่อ (Unknown)";
}

export function sortLogsByNewest(logs) {
  return [...logs].sort(
    (a, b) => new Date(b.logged_at) - new Date(a.logged_at),
  );
}

export function buildLatestByTask(logs) {
  return sortLogsByNewest(logs).reduce((acc, log) => {
    const key = `${log.tray_id}-${log.process_id}`;
    if (!acc[key]) {
      acc[key] = log;
    }
    return acc;
  }, {});
}

export function buildLatestLogByTray(logs) {
  return sortLogsByNewest(logs).reduce((acc, log) => {
    const key = String(log.tray_id);
    if (!acc[key]) {
      acc[key] = log;
    }
    return acc;
  }, {});
}

export function buildOperatorRows(logs) {
  const sortedLogs = sortLogsByNewest(logs);
  const latestByTask = buildLatestByTask(sortedLogs);
  const stats = sortedLogs.reduce((acc, log) => {
    const operatorName = getOperatorName(log);
    if (!acc[operatorName]) {
      acc[operatorName] = {
        name: operatorName,
        start: 0,
        finish: 0,
        ng: 0,
        latestLog: log,
        history: [],
      };
    }

    if (log.action === "start") acc[operatorName].start += 1;
    if (log.action === "finish") acc[operatorName].finish += 1;
    if (log.action === "ng") acc[operatorName].ng += 1;
    acc[operatorName].history.push(log);
    return acc;
  }, {});

  Object.values(stats).forEach((row) => {
    const activeLogs = Object.values(latestByTask).filter(
      (taskLog) =>
        taskLog.action === "start" && getOperatorName(taskLog) === row.name,
    );

    row.currentTask =
      activeLogs.sort(
        (a, b) => new Date(b.logged_at) - new Date(a.logged_at),
      )[0] || null;
  });

  return Object.values(stats).sort((a, b) => b.finish - a.finish);
}

export function buildLineRows({ logs, processes, lines }) {
  const sortedLogs = sortLogsByNewest(logs);
  const latestByTask = buildLatestByTask(sortedLogs);
  const activeByProcess = Object.values(latestByTask).reduce((acc, log) => {
    if (log.action !== "start") {
      return acc;
    }

    const processKey = String(log.process_id);
    if (!acc[processKey]) {
      acc[processKey] = [];
    }

    acc[processKey].push({ qr_code: log.qr_code, logged_at: log.logged_at });
    return acc;
  }, {});

  const statsByProcess = processes.reduce((acc, processItem) => {
    acc[processItem.id] = {
      id: processItem.id,
      line_id: processItem.line_id,
      process: processItem.name,
      seq: processItem.sequence,
      activeItems: (activeByProcess[processItem.id] || []).sort(
        (a, b) => new Date(b.logged_at) - new Date(a.logged_at),
      ),
      start: 0,
      finish: 0,
      ng: 0,
    };
    return acc;
  }, {});

  logs.forEach((log) => {
    const processId = log.process_id;
    if (statsByProcess[processId]) {
      if (log.action === "start") statsByProcess[processId].start += 1;
      if (log.action === "finish") statsByProcess[processId].finish += 1;
      if (log.action === "ng") statsByProcess[processId].ng += 1;
    }
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return lines.map((line) => {
    const processItems = Object.values(statsByProcess)
      .filter((processItem) => processItem.line_id === line.id)
      .sort((a, b) => a.seq - b.seq);

    let finishToday = 0;
    let ngToday = 0;

    logs.forEach((log) => {
      const processItem = statsByProcess[log.process_id];
      if (processItem && processItem.line_id === line.id) {
        const loggedAt = new Date(log.logged_at);
        if (loggedAt >= todayStart) {
          if (log.action === "finish") finishToday += 1;
          if (log.action === "ng") ngToday += 1;
        }
      }
    });

    const hasActive = processItems.some((item) => item.activeItems.length > 0);

    return {
      ...line,
      finishToday,
      ngToday,
      hasActive,
      processes: processItems,
    };
  });
}

export function formatShortDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("th-TH");
}

export function formatShortTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
