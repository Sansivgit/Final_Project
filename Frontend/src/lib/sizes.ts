/** Apparel sizes shown on PDP / filters (canonical labels). */
export const STANDARD_APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

/** Map stored size string (any casing) to canonical label, or null if not a standard apparel size. */
export function canonicalApparelSize(raw: string): string | null {
  const t = raw.trim().toUpperCase();
  const map: Record<string, string> = {
    XS: "XS",
    S: "S",
    M: "M",
    L: "L",
    XL: "XL",
    XXL: "XXL",
  };
  return map[t] ?? null;
}

/** Standard sizes that exist on this product, in XS → XXL order; labels are canonical. */
export function orderedStandardSizes(productSizes: string[]): string[] {
  return STANDARD_APPAREL_SIZES.filter((sz) =>
    productSizes.some((p) => canonicalApparelSize(p) === sz),
  );
}

/** Resolve which stored size string to pass to cart for a canonical pick. */
export function resolveStoredSize(canonical: string, productSizes: string[]): string | undefined {
  return productSizes.find((p) => canonicalApparelSize(p) === canonical);
}
