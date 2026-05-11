import { resolveApiUrl } from "@/lib/api";

/** Cloth type names from MongoDB (admin-managed); empty if API unreachable. */
export async function fetchCatalogClothTypes(): Promise<string[]> {
  const url = resolveApiUrl("/api/catalog/cloth-types");
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as string[]).filter((x) => typeof x === "string" && x.trim()) : [];
  } catch {
    return [];
  }
}
