/** Used when the API is offline or cloth types failed to load */
export const FALLBACK_CLOTH_TYPES = [
  "Hoodies",
  "Pants",
  "Tees",
  "Blazers",
  "Suits",
  "Formal trousers",
  "Dress shirts",
  "Pencil skirts",
  "Formal dresses",
  "Crop tops",
  "Denim jackets",
  "Mini dresses",
  "Jumpsuits",
  "Skater skirts",
] as const;

/** Product audience / gender category */
export const PRODUCT_CATEGORIES = ["Men", "Women", "Unisex"] as const;

/** Apparel / general numeric clothing sizes */
export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

/** Apparel sizes for all cloth types in this admin catalog */
export function sizesForClothType(_clothType: string): readonly string[] {
  return APPAREL_SIZES;
}

/** Curated palette — users can add custom colors too */
export const PRESET_COLORS: ReadonlyArray<{ name: string; hex: string }> = [
  { name: "Black", hex: "#0a0a0a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Volt", hex: "#d4ff00" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Olive", hex: "#4a5d3a" },
  { name: "Bone", hex: "#e8e4dc" },
  { name: "Red", hex: "#b91c1c" },
];

/** Hide native number spinners (use plain validated numeric entry) */
export const inputNoSpinner =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
