import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Pencil, Search, Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/context/AdminContext";
import {
  apiCreateClothType,
  apiDeleteClothType,
  apiUpdateClothType,
  fetchClothTypes,
  type ApiClothType,
} from "@/services/api";
import { FALLBACK_CLOTH_TYPES } from "@/lib/productFormConstants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const PER_PAGE = 8;

function sortClothTypesNewestFirst(rows: ApiClothType[]): ApiClothType[] {
  return [...rows].sort(
    (a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0),
  );
}

export function ClothTypesPage() {
  const { admin, useBackend } = useAdmin();
  const [items, setItems] = useState<ApiClothType[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ApiClothType | null>(null);

  useEffect(() => {
    if (!useBackend || !admin?.token) {
      setLoading(false);
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchClothTypes(admin.token)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load cloth types");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [useBackend, admin?.token]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = !term ? items : items.filter((row) => row.name.toLowerCase().includes(term));
    return sortClothTypesNewestFirst(base);
  }, [items, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !admin?.token) return;
    setBusy(true);
    try {
      const created = await apiCreateClothType(trimmed, admin.token);
      setItems((prev) => sortClothTypesNewestFirst([...prev, created]));
      setName("");
      toast.success("Cloth type added");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row: ApiClothType) => {
    setEditingId(row._id);
    setEditName(row.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!editingId || !admin?.token) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const updated = await apiUpdateClothType(editingId, trimmed, admin.token);
      setItems((prev) =>
        sortClothTypesNewestFirst(prev.map((x) => (x._id === editingId ? updated : x))),
      );
      cancelEdit();
      toast.success("Cloth type updated");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget || !admin?.token) return;
    setBusy(true);
    try {
      await apiDeleteClothType(deleteTarget._id, admin.token);
      setItems((prev) => prev.filter((x) => x._id !== deleteTarget._id));
      if (editingId === deleteTarget._id) cancelEdit();
      toast.success("Removed");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!useBackend || !admin?.token) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Cloth types</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Cloth types are stored in MongoDB when the admin app uses the API (<code className="text-xs">VITE_API_URL</code>
            ). Sign in to add or remove types.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Offline fallback (Add product only)</p>
          <p className="mt-2">{FALLBACK_CLOTH_TYPES.join(" · ")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl uppercase">Cloth types</h1>
        <p className="mt-1 text-sm text-muted-foreground">{filtered.length} total</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New cloth type</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Outerwear"
            maxLength={80}
            disabled={busy || loading}
          />
        </div>
        <Button type="submit" disabled={busy || loading || !name.trim()} className="h-10">
          Add
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead className="whitespace-nowrap text-muted-foreground">Added</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                    <Shirt className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No cloth types found
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                current.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      {editingId === row._id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={80}
                          disabled={busy}
                          className="max-w-md"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : (
                        <span className="font-medium">{row.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === row._id ? (
                        <div className="inline-flex gap-1">
                          <Button size="sm" type="button" disabled={busy || !editName.trim()} onClick={() => void saveEdit()}>
                            Save
                          </Button>
                          <Button size="sm" type="button" variant="outline" disabled={busy} onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-1">
                          <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => startEdit(row)}
                            aria-label={`Edit ${row.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={busy}
                            onClick={() => setDeleteTarget(row)}
                            aria-label={`Delete ${row.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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

      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove cloth type?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  “{deleteTarget.name}” will be removed from this list. Existing products keep this label until edited.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void onConfirmDelete()}
              className="bg-destructive hover:bg-destructive/90"
              disabled={busy}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
