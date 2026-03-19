export const ADMIN_TABS = ["lines", "trays", "users"];
export const DEFAULT_ADMIN_TAB = "lines";

export function getValidAdminTab(value) {
  return ADMIN_TABS.includes(value) ? value : DEFAULT_ADMIN_TAB;
}

export function createAdminSearch({
  tab = DEFAULT_ADMIN_TAB,
  mode = "",
  id = "",
  subId = "",
}) {
  const params = new URLSearchParams();
  params.set("tab", getValidAdminTab(tab));

  if (mode) {
    params.set("mode", mode);
  }

  if (id) {
    params.set("id", String(id));
  }

  if (subId) {
    params.set("subId", String(subId));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getAdminViewState(searchParams) {
  return {
    activeMenu: getValidAdminTab(searchParams.get("tab")),
    detailMode: searchParams.get("mode") || "",
    detailId: searchParams.get("id") || "",
    detailSubId: searchParams.get("subId") || "",
  };
}

export function normalizeAdminSearch(searchParams) {
  return createAdminSearch({
    tab: getValidAdminTab(searchParams.get("tab")),
    mode: searchParams.get("mode") || "",
    id: searchParams.get("id") || "",
    subId: searchParams.get("subId") || "",
  });
}
