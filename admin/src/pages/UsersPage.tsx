import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Users as UsersIcon } from "lucide-react";
import { useAdmin, type AdminCustomer } from "@/context/AdminContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserDetailsSheet, CustomerAvatar } from "@/components/admin/UserDetailsSheet";
import { formatInr } from "@/lib/formatInr";

const PER_PAGE = 8;

export function UsersPage() {
  const { users } = useAdmin();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [detailUser, setDetailUser] = useState<AdminCustomer | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let list = users.filter(
      (u) =>
        !t ||
        u.name.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t) ||
        (u.phone && u.phone.toLowerCase().includes(t)),
    );
    list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }, [users, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl uppercase">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">{filtered.length} total</p>
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
            placeholder="Search by name, email, or phone…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[200px]">Customer</TableHead>
                <TableHead className="min-w-[180px]">Email</TableHead>
                <TableHead className="whitespace-nowrap">Phone</TableHead>
                <TableHead className="text-right whitespace-nowrap">Orders</TableHead>
                <TableHead className="text-right whitespace-nowrap">Items bought</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total spent</TableHead>
                <TableHead className="whitespace-nowrap">Last purchase</TableHead>
                <TableHead className="whitespace-nowrap">Joined</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="py-12 text-center text-muted-foreground">
                      <UsersIcon className="mx-auto mb-2 h-8 w-8" />
                      No users found
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {current.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CustomerAvatar user={u} />
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{u.phone || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.totalOrders}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.totalProductsPurchased}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatInr(u.totalSpent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {u.lastPurchaseAt
                      ? new Date(u.lastPurchaseAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.isBlocked ? "destructive" : "outline"}
                      className={
                        u.isBlocked
                          ? ""
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      }
                    >
                      {u.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setDetailUser(u)}>
                      View details
                    </Button>
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

      <UserDetailsSheet user={detailUser} open={detailUser !== null} onOpenChange={(v) => !v && setDetailUser(null)} />
    </div>
  );
}
