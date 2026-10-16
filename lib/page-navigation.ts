export function secondaryPageBackHref(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "")
  if (path.startsWith("/more/")) return "/more"
  if (path.startsWith("/menu/")) return "/menu"
  if (path.startsWith("/bills/")) return "/bills"
  if (path === "/billing/review") return "/billing"
  if (path === "/billing/payment") return "/billing/review"
  if (path === "/billing/confirm" || path === "/billing/success")
    return "/bills"
  return null
}
