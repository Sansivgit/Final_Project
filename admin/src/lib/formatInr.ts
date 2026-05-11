/** Indian Rupees display (₹) with en-IN digit grouping. */
export function formatInr(
  amount: number,
  options: Intl.NumberFormatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 },
): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN", options)}`;
}
