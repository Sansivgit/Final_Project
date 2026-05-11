import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon, title, description, ctaLabel, ctaTo,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Icon className="h-9 w-9 text-muted-foreground" />
      </div>
      <h2 className="font-display text-3xl uppercase">{title}</h2>
      <p className="mt-2 text-muted-foreground max-w-sm">{description}</p>
      <Button asChild className="mt-6 volt-primary-btn">
        <Link to={ctaTo as any}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
