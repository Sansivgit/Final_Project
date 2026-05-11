import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ImageIcon, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productSchema, type ProductFormValues } from "@/schemas/product";
import type { AdminProduct } from "@/context/AdminContext";
import { useAdmin } from "@/context/AdminContext";
import { uploadProductImage, fetchClothTypes } from "@/services/api";
import { cn } from "@/lib/utils";
import {
  FALLBACK_CLOTH_TYPES,
  inputNoSpinner,
  PRESET_COLORS,
  PRODUCT_CATEGORIES,
  sizesForClothType,
} from "@/lib/productFormConstants";

const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const MAX_BYTES = 5 * 1024 * 1024;

function coerceProductCategory(raw: string): ProductFormValues["category"] {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as ProductFormValues["category"])
    : "Unisex";
}

function normalizeHex(raw: string): string {
  let s = raw.trim();
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return s.toLowerCase();
}

function validateImageFile(f: File): string | null {
  if (!ACCEPT_TYPES.includes(f.type)) {
    return "Please use JPG, PNG, or WebP only.";
  }
  if (f.size > MAX_BYTES) {
    return "Image must be 5MB or smaller.";
  }
  return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const defaultFormValues = (): ProductFormValues => ({
  title: "",
  description: "",
  price: 0,
  discount: 0,
  clothType: "Tees",
  category: "Unisex",
  brand: "VOLT",
  stock: 0,
  sizes: ["M"],
  colors: [{ name: "Black", hex: "#0a0a0a" }],
});

export function ProductFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: AdminProduct | null;
  onSubmit: (values: Omit<AdminProduct, "id" | "createdAt">) => void | Promise<void>;
}) {
  const { admin, useBackend } = useAdmin();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadStep, setUploadStep] = useState<"idle" | "cloudinary" | "save">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#808080");

  const [clothOptionNames, setClothOptionNames] = useState<string[]>(() => [...FALLBACK_CLOTH_TYPES]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultFormValues(),
  });

  const clothType = form.watch("clothType");
  const selectedSizes = form.watch("sizes");
  const watchedColors = form.watch("colors");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "colors",
  });

  const clothTypeSelectOptions = useMemo(() => {
    const base = clothOptionNames.length > 0 ? clothOptionNames : [...FALLBACK_CLOTH_TYPES];
    if (initial?.clothType && !base.includes(initial.clothType)) {
      return [initial.clothType, ...base];
    }
    return base;
  }, [clothOptionNames, initial?.clothType]);

  useEffect(() => {
    if (!open) return;
    if (!useBackend || !admin?.token) {
      setClothOptionNames([...FALLBACK_CLOTH_TYPES]);
      return;
    }
    let cancelled = false;
    fetchClothTypes(admin.token)
      .then((rows) => {
        if (!cancelled && rows.length > 0) {
          setClothOptionNames(rows.map((r) => r.name));
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not load cloth types");
          setClothOptionNames([...FALLBACK_CLOTH_TYPES]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, useBackend, admin?.token]);

  useEffect(() => {
    if (!open) return;
    const opts = clothTypeSelectOptions;
    if (opts.length === 0) return;
    if (initial) return;
    const cur = form.getValues("clothType");
    if (!opts.includes(cur)) {
      form.setValue("clothType", opts[0], { shouldValidate: true });
    }
  }, [open, initial, clothTypeSelectOptions, form]);

  useEffect(() => {
    const allowed = sizesForClothType(clothType);
    const allowedSet = new Set(allowed);
    const cur = form.getValues("sizes");
    const filtered = cur.filter((s) => allowedSet.has(s));
    const next = filtered.length > 0 ? filtered : [allowed[0] ?? "M"];
    const same = cur.length === next.length && cur.every((s, i) => s === next[i]);
    if (!same) {
      form.setValue("sizes", next, { shouldValidate: true });
    }
  }, [clothType, form]);

  const revokePreview = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
  };

  const applyFile = (f: File) => {
    const err = validateImageFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    revokePreview();
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
      setIsDragging(false);
      setBusy(false);
      setUploadStep("idle");
      setCustomColorName("");
      setCustomColorHex("#808080");
      if (fileRef.current) fileRef.current.value = "";
      form.reset(
        initial
          ? {
              title: initial.title,
              description: initial.description,
              price: initial.price,
              discount: initial.discount,
              clothType: initial.clothType,
              category: coerceProductCategory(initial.category),
              brand: initial.brand,
              stock: initial.stock,
              sizes: initial.sizes?.length ? [...initial.sizes] : ["M"],
              colors:
                initial.colors?.length > 0
                  ? initial.colors.map((c) => ({ name: c.name, hex: normalizeHex(c.hex) }))
                  : [{ name: "Black", hex: "#0a0a0a" }],
            }
          : defaultFormValues(),
      );
      if (initial?.imageUrl) {
        setPreview(initial.imageUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  };

  const clearImage = () => {
    revokePreview();
    setFile(null);
    setPreview(initial?.imageUrl ?? null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const toggleSize = (sz: string) => {
    const allowed = sizesForClothType(form.getValues("clothType"));
    if (!allowed.includes(sz)) return;
    const cur = form.getValues("sizes");
    const set = new Set(cur);
    if (set.has(sz)) set.delete(sz);
    else set.add(sz);
    const next = allowed.filter((a) => set.has(a));
    form.setValue("sizes", next.length > 0 ? next : [sz], { shouldValidate: true });
  };

  const togglePresetColor = (preset: { name: string; hex: string }) => {
    const colors = form.getValues("colors");
    const idx = colors.findIndex((c) => c.name === preset.name && c.hex === preset.hex);
    if (idx >= 0) {
      if (colors.length <= 1) {
        toast.error("Keep at least one color");
        return;
      }
      remove(idx);
    } else {
      append({ name: preset.name, hex: preset.hex });
    }
  };

  const addCustomColor = () => {
    const name = customColorName.trim();
    if (!name) {
      toast.error("Enter a color name");
      return;
    }
    let hex: string;
    try {
      hex = normalizeHex(customColorHex);
      if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
        throw new Error("bad hex");
      }
    } catch {
      toast.error("Invalid hex color");
      return;
    }
    append({ name, hex });
    setCustomColorName("");
    setCustomColorHex("#808080");
    form.trigger("colors");
  };

  const runSubmit = form.handleSubmit(async (values) => {
    let imageUrl = "";

    try {
      setBusy(true);

      if (file && useBackend && admin?.token) {
        setUploadStep("cloudinary");
        const { url } = await uploadProductImage(file, admin.token);
        imageUrl = url;
        setUploadStep("save");
      } else if (file) {
        setUploadStep("cloudinary");
        imageUrl = await readFileAsDataUrl(file);
        setUploadStep("save");
      } else if (initial?.imageUrl) {
        imageUrl = initial.imageUrl;
        setUploadStep("save");
      } else {
        toast.error("Please select a product image.");
        return;
      }

      const payload: Omit<AdminProduct, "id" | "createdAt"> = {
        title: values.title,
        description: values.description,
        price: values.price,
        discount: values.discount,
        clothType: values.clothType,
        category: values.category,
        brand: values.brand,
        stock: values.stock,
        sizes: values.sizes,
        colors: values.colors.map((c) => ({ name: c.name.trim(), hex: normalizeHex(c.hex) })),
        imageUrl,
      };

      await Promise.resolve(onSubmit(payload));
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Something went wrong");
    } finally {
      setBusy(false);
      setUploadStep("idle");
    }
  });

  const err = form.formState.errors;
  const showPreview = Boolean(preview);
  const canSubmit = !busy && !form.formState.isSubmitting;
  const sizeOptions = sizesForClothType(clothType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-y-auto p-0 sm:rounded-xl">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle className="font-display text-xl uppercase tracking-tight">
            {initial ? "Edit product" : "Add product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={runSubmit} className="grid gap-5 px-6 py-5 sm:grid-cols-2">
          <Field label="Title" error={err.title?.message} className="sm:col-span-2">
            <Input {...form.register("title")} placeholder="Phantom Runner 1" disabled={busy} />
          </Field>
          <Field label="Description" error={err.description?.message} className="sm:col-span-2">
            <textarea
              {...form.register("description")}
              rows={4}
              disabled={busy}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              placeholder="Product description…"
            />
          </Field>
          <Field label="Category" error={err.category?.message}>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                  <SelectTrigger className="h-10 focus:ring-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {PRODUCT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Brand" error={err.brand?.message}>
            <Input {...form.register("brand")} placeholder="VOLT" disabled={busy} />
          </Field>
          <Field label="Price (₹)" error={err.price?.message}>
            <Input
              type="number"
              step="0.01"
              min={0}
              inputMode="decimal"
              className={inputNoSpinner}
              {...form.register("price", { valueAsNumber: true })}
              disabled={busy}
            />
          </Field>
          <Field label="Discount (%)" error={err.discount?.message}>
            <Input
              type="number"
              step="1"
              min={0}
              max={100}
              inputMode="numeric"
              className={inputNoSpinner}
              {...form.register("discount", { valueAsNumber: true })}
              disabled={busy}
            />
          </Field>
          <Field label="Cloth type" error={err.clothType?.message}>
            <Controller
              control={form.control}
              name="clothType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={busy}
                >
                  <SelectTrigger className="h-10 focus:ring-2">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {clothTypeSelectOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Stock (units)" error={err.stock?.message}>
            <Input
              type="number"
              step="1"
              min={0}
              inputMode="numeric"
              className={inputNoSpinner}
              {...form.register("stock", { valueAsNumber: true })}
              disabled={busy}
            />
          </Field>

          <div className="space-y-2 sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sizes offered
            </span>
            <p className="text-[11px] text-muted-foreground">
              Tap to toggle. At least one size is required.
            </p>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((sz) => {
                const active = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleSize(sz)}
                    className={cn(
                      "min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-transparent hover:bg-muted",
                    )}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
            {err.sizes?.message && <span className="block text-xs text-destructive">{err.sizes.message}</span>}
          </div>

          <div className="space-y-3 sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Colors
            </span>
            <p className="text-[11px] text-muted-foreground">
              Choose presets or add a custom name + hex. At least one color is required.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((preset) => {
                const active = watchedColors.some(
                  (c) => c.name === preset.name && c.hex === preset.hex,
                );
                return (
                  <button
                    key={`${preset.name}-${preset.hex}`}
                    type="button"
                    disabled={busy}
                    onClick={() => togglePresetColor(preset)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 text-xs font-medium transition-colors",
                      active ? "border-foreground bg-muted" : "border-border hover:bg-muted/80",
                    )}
                  >
                    <span
                      className="h-6 w-6 rounded-full border border-border shadow-inner"
                      style={{ backgroundColor: preset.hex }}
                      aria-hidden
                    />
                    {preset.name}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex-1 min-w-[140px] space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Custom name</label>
                <Input
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  placeholder="e.g. Midnight"
                  disabled={busy}
                  className="h-9"
                />
              </div>
              <div className="w-full sm:w-28 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hex</label>
                <Input
                  type="color"
                  value={customColorHex.length === 7 ? customColorHex : "#808080"}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  disabled={busy}
                  className="h-9 cursor-pointer p-1"
                />
              </div>
              <Button type="button" variant="secondary" size="sm" className="h-9 gap-1" onClick={addCustomColor} disabled={busy}>
                <Plus className="h-4 w-4" /> Add color
              </Button>
            </div>

            <ul className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              {fields.map((field, index) => (
                <li key={field.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-8 w-8 shrink-0 rounded-full border border-border shadow-inner"
                      style={{ backgroundColor: form.watch(`colors.${index}.hex`) }}
                      aria-hidden
                    />
                    <span className="truncate font-medium">{form.watch(`colors.${index}.name`)}</span>
                    <span className="text-xs text-muted-foreground font-mono">{form.watch(`colors.${index}.hex`)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    disabled={busy || fields.length <= 1}
                    onClick={() => {
                      if (fields.length <= 1) {
                        toast.error("Keep at least one color");
                        return;
                      }
                      remove(index);
                    }}
                    aria-label="Remove color"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            {err.colors?.root?.message && (
              <span className="block text-xs text-destructive">{String(err.colors.root.message)}</span>
            )}
            {typeof err.colors?.message === "string" && (
              <span className="block text-xs text-destructive">{err.colors.message}</span>
            )}
          </div>

          <div className="space-y-3 sm:col-span-2">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Product image</div>

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="sr-only"
              aria-label="Choose product image"
              onChange={onInputChange}
              disabled={busy}
            />

            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!busy) fileRef.current?.click();
                }
              }}
              onClick={() => !busy && fileRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                "relative rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all sm:px-8 sm:py-10",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isDragging && "border-volt bg-volt/10",
                !isDragging && "border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/30",
                busy && "pointer-events-none opacity-90",
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-muted p-3">
                  <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-sm font-medium">Drag & drop an image here</p>
                <p className="text-xs text-muted-foreground">or click to browse from your device</p>
                <p className="mt-2 text-[11px] text-muted-foreground">JPG, PNG or WebP · max 5MB</p>
              </div>
              {busy && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-background/80 backdrop-blur-[1px]">
                  <Loader2 className="h-9 w-9 animate-spin text-foreground" aria-hidden />
                  <p className="text-sm font-medium">
                    {uploadStep === "cloudinary" ? "Uploading to Cloudinary…" : "Saving product…"}
                  </p>
                </div>
              )}
            </div>

            {showPreview && (
              <div className="relative flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24">
                  <img src={preview!} alt="" className="h-full w-full object-cover" />
                  {busy && uploadStep === "save" && file && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                      <div className="flex items-center gap-2 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white shadow">
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Uploaded
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate">{file ? file.name : "Existing image"}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-8 px-2 text-destructive hover:text-destructive disabled:opacity-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                    disabled={busy}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remove image
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 flex-col gap-2 border-t bg-background pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} className="min-w-[148px]">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {uploadStep === "cloudinary" ? "Uploading…" : "Saving…"}
                </>
              ) : initial ? (
                "Save changes"
              ) : (
                "Create product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
