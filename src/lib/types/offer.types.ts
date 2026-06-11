export type OfferBadgeColor = 'primary' | 'success' | 'warning' | 'destructive';

export interface Offer {
  id: number;
  title: string;
  description: string;
  discountPercent: number;
  minDays: number;
  maxDays: number | null;
  isActive: boolean;
  badgeColor: OfferBadgeColor;
  createdAt: string;
  updatedAt: string;
}

export type OfferTier = Pick<Offer, 'minDays' | 'maxDays' | 'discountPercent' | 'title'>;
