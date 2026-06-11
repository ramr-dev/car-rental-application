import { Tag } from "lucide-react";
import type { Offer, OfferBadgeColor } from "@/lib/types/offer.types";

const CARD_COLOR: Record<OfferBadgeColor, string> = {
  primary:     "bg-primary/8 border-primary/25 text-primary",
  success:     "bg-success/8 border-success/25 text-success",
  warning:     "bg-warning/8 border-warning/25 text-warning",
  destructive: "bg-destructive/8 border-destructive/25 text-destructive",
};

const BADGE_COLOR: Record<OfferBadgeColor, string> = {
  primary:     "bg-primary text-primary-foreground",
  success:     "bg-success text-success-foreground",
  warning:     "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

function durationLabel(minDays: number, maxDays: number | null): string {
  if (maxDays === null) return `${minDays}+ days`;
  if (minDays === maxDays) return `${minDays} days`;
  return `${minDays}–${maxDays} days`;
}

function safeColor(color: string): OfferBadgeColor {
  return (["primary", "success", "warning", "destructive"] as const).includes(
    color as OfferBadgeColor,
  )
    ? (color as OfferBadgeColor)
    : "primary";
}

export function OffersBanner({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Special Offers</p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {offers.length} available
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {offers.map((offer) => {
          const color = safeColor(offer.badgeColor);
          return (
            <div
              key={offer.id}
              className={`flex min-w-[188px] shrink-0 flex-col gap-2 rounded-lg border p-3 ${CARD_COLOR[color]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-base font-bold leading-tight ${BADGE_COLOR[color]}`}
                >
                  {offer.discountPercent}% OFF
                </span>
                <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                  {durationLabel(offer.minDays, offer.maxDays)}
                </span>
              </div>
              <p className="text-sm font-semibold leading-snug">{offer.title}</p>
              {offer.description && (
                <p className="text-xs leading-snug opacity-75">{offer.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
