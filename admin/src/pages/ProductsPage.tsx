import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, PackageX } from "lucide-react";
import { toast } from "sonner";
import { useAdmin, type AdminProduct } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { formatInr } from "@/lib/formatInr";

type SortKey = "title" | "price" | "stock" | "discount" | "createdAt";

export function ProductsPage() {
  const { products, createProduct, updateProduct, deleteProduct } = useAdmin();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const PER_PAGE = 8;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = products.filter(
      (p) => !term || p.title.toLowerCase().includes(term) || p.clothType.toLowerCase().includes(term),
    );
    list = [...list].sort((a, b) => {
      if (sortKey === "createdAt") {
        const da = +new Date(a.createdAt);
        const db = +new Date(b.createdAt);
        return sortDir === "asc" ? da - db : db - da;
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [products, q, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "createdAt" ? "desc" : "asc");
    }
  };

  const onSubmit = async (values: Omit<AdminProduct, "id" | "createdAt">) => {
    try {
      if (editing) {
        await updateProduct(editing.id, values);
        toast.success("Product updated");
      } else {
        await createProduct(values);
        toast.success("Product created");
      }
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      toast.success("Product deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const stockBadge = (s: number) =>
    s === 0 ? (
      <Badge variant="destructive">Out</Badge>
    ) : s < 30 ? (
      <Badge className="bg-amber-500 hover:bg-amber-500/90">Low</Badge>
    ) : (
      <Badge className="bg-emerald-500 hover:bg-emerald-500/90">In stock</Badge>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} total</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or type…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16">Image</TableHead>
                <TableHead>
                  <SortBtn label="Title" k="title" cur={sortKey} dir={sortDir} onClick={toggleSort} />
                </TableHead>
                <TableHead>Cloth Type</TableHead>
                <TableHead>
                  <SortBtn label="Price" k="price" cur={sortKey} dir={sortDir} onClick={toggleSort} />
                </TableHead>
                <TableHead>
                  <SortBtn label="Discount" k="discount" cur={sortKey} dir={sortDir} onClick={toggleSort} />
                </TableHead>
                <TableHead>
                  <SortBtn label="Stock" k="stock" cur={sortKey} dir={sortDir} onClick={toggleSort} />
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <SortBtn label="Added" k="createdAt" cur={sortKey} dir={sortDir} onClick={toggleSort} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="py-12 text-center text-muted-foreground">
                      <PackageX className="mx-auto mb-2 h-8 w-8" />
                      No products found
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {current.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <img src={p.imageUrl} alt={p.title} className="h-12 w-12 rounded object-cover" />
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate font-medium">{p.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.clothType}</Badge>
                  </TableCell>
                  <TableCell>{formatInr(p.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{p.discount > 0 ? `${p.discount}%` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">{p.stock}</span>
                      {stockBadge(p.stock)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(p.id)}
                        aria-label="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <div className="text-muted-foreground">
            Page {page} of {pageCount}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        initial={editing}
        onSubmit={onSubmit}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortBtn({
  label,
  k,
  cur,
  dir,
  onClick,
}: {
  label: string;
  k: SortKey;
  cur: SortKey;
  dir: "asc" | "desc";
  onClick: (k: SortKey) => void;
}) {
  return (
    <button type="button" onClick={() => onClick(k)} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}{" "}
      <ArrowUpDown
        className={`h-3 w-3 ${cur === k ? "text-foreground" : "opacity-50"} ${cur === k && dir === "desc" ? "rotate-180" : ""}`}
      />
    </button>
  );
}
