import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Youtube, Facebook } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/api";

const shopLinks = [
  { label: "Men", category: "Men" },
  { label: "Women", category: "Women" },
  { label: "Unisex", category: "Unisex" },
] as const;

type FooterColumn = { title: string; disabledLabels: string[] };

const footerColumns: FooterColumn[] = [
  {
    title: "Help",
    disabledLabels: ["Shipping", "Returns", "Size Guide", "Contact"],
  },
  {
    title: "Company",
    disabledLabels: ["About", "Careers", "Press", "Sustainability"],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubscribe(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter your email");
      return;
    }
    setBusy(true);
    try {
      const res = await subscribeNewsletter(trimmed);
      toast.success(res.message || "You are subscribed");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="bg-neutral-950 text-neutral-50 mt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="font-display text-3xl font-bold">
            VOLT<span className="text-volt">.</span>
          </div>
          <p className="mt-4 text-sm text-neutral-50/70 max-w-xs">
            Built for athletes. Worn by everyone. Engineered in motion since 2024.
          </p>
          <form className="mt-6 flex max-w-sm" onSubmit={onSubscribe}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={busy}
              className="flex-1 bg-white/10 border border-white/20 rounded-l-md px-4 py-3 text-sm placeholder:text-white/50 outline-none focus:border-volt disabled:opacity-60"
              aria-label="Email"
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-volt text-volt-foreground font-display uppercase font-bold px-5 rounded-r-md hover:brightness-110 transition disabled:opacity-60"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div>
          <div className="font-display uppercase text-sm tracking-widest mb-4">Shop</div>
          <ul className="space-y-2">
            {shopLinks.map(({ label, category }) => (
              <li key={label}>
                <Link
                  to="/products"
                  search={{ category } as Record<string, unknown>}
                  className="text-sm text-neutral-50/70 hover:text-volt transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {footerColumns.map((col) => (
          <div key={col.title}>
            <div className="font-display uppercase text-sm tracking-widest mb-4">{col.title}</div>
            <ul className="space-y-2">
              {col.disabledLabels.map((label) => (
                <li key={label}>
                  <span
                    className="text-sm text-neutral-50/35 cursor-default select-none"
                    aria-disabled="true"
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-neutral-50/60">
            © {new Date().getFullYear()} VOLT. All rights reserved.
          </div>
          <div className="flex gap-3">
            {[Instagram, Twitter, Youtube, Facebook].map((I, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="h-9 w-9 rounded-full border border-white/20 flex items-center justify-center text-neutral-50/35 cursor-default select-none"
              >
                <I className="h-4 w-4" />
              </span>
            ))}
          </div>
          <div className="flex gap-2 text-xs text-neutral-50/50">
            <span>VISA</span>
            <span>MC</span>
            <span>AMEX</span>
            <span>PAYPAL</span>
            <span>APPLE PAY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
