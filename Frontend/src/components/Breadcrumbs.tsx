import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li><Link to="/" className="hover:text-foreground transition-colors uppercase tracking-wider">Home</Link></li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            {it.to ? (
              <Link to={it.to as any} className="hover:text-foreground transition-colors uppercase tracking-wider">{it.label}</Link>
            ) : (
              <span className="text-foreground uppercase tracking-wider">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
