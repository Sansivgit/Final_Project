import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/lib/productFormConstants";

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a valid hex color (#RGB or #RRGGBB)");

export const productColorSchema = z.object({
  name: z.string().trim().min(1, "Color name required").max(40),
  hex: hexColor,
});

export const productSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  description: z.string().trim().min(20, "At least 20 characters").max(2000),
  price: z.number({ error: "Required" }).positive("Price must be positive").max(100000),
  discount: z.number({ error: "Required" }).min(0, "Min 0").max(100, "Max 100"),
  clothType: z.string().trim().min(1, "Required").max(80),
  category: z.enum(PRODUCT_CATEGORIES),
  brand: z.string().trim().min(1, "Brand is required").max(80),
  stock: z.number({ error: "Required" }).int("Whole number").min(0, "Min 0").max(100000),
  sizes: z.array(z.string().min(1)).min(1, "Select at least one size"),
  colors: z.array(productColorSchema).min(1, "Add at least one color"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductColorFormValue = z.infer<typeof productColorSchema>;
