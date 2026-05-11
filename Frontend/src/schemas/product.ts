import { z } from "zod";

export const productSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  description: z.string().trim().min(20, "At least 20 characters").max(2000),
  price: z.number({ error: "Required" }).positive("Price must be positive").max(100000),
  discount: z.number({ error: "Required" }).min(0, "Min 0").max(100, "Max 100"),
  clothType: z.string().trim().min(1, "Required").max(60),
  stock: z.number({ error: "Required" }).int("Whole number").min(0, "Min 0").max(100000),
  imageUrl: z.string().trim().url("Must be a valid URL").max(2000),
});

export type ProductFormValues = z.infer<typeof productSchema>;
