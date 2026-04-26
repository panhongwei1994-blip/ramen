export type AdminLang = "en" | "zh";
export type AdminMode = "front" | "kitchen";

type BuildAdminHrefOptions = {
  lang?: AdminLang;
  mode?: AdminMode;
  viewAll?: boolean;
};

export function getAdminLangFromUrl(url: URL): AdminLang {
  return url.searchParams.get("ui") === "zh" ? "zh" : "en";
}

export function getAdminModeFromUrl(url: URL): AdminMode {
  return url.searchParams.get("mode") === "kitchen" ? "kitchen" : "front";
}

export function buildAdminHref(
  pathname: string,
  searchParams: URLSearchParams,
  options: BuildAdminHrefOptions = {},
) {
  const params = new URLSearchParams(searchParams);

  if (options.lang === "zh") params.set("ui", "zh");
  if (options.lang === "en") params.delete("ui");

  if (options.mode === "kitchen") params.set("mode", "kitchen");
  if (options.mode === "front") params.delete("mode");

  if (options.viewAll === true) params.set("view", "all");
  if (options.viewAll === false) params.delete("view");

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildOrderDetailHref(
  orderNo: string,
  options: { lang: AdminLang; mode: AdminMode },
) {
  const params = new URLSearchParams();
  if (options.lang === "zh") params.set("ui", "zh");
  if (options.mode === "kitchen") params.set("mode", "kitchen");
  const query = params.toString();
  return `/admin/orders/${orderNo}${query ? `?${query}` : ""}`;
}
