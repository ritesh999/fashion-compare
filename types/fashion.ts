export interface RetailerProduct {
  retailer: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  url: string | null;
  inStock: boolean;
  sizes: string[];
  rating: number;
  reviewCount: number;
  badge: string | null;
}

export type AgentStep =
  | { type: "init"; text: string }
  | { type: "search"; text: string }
  | { type: "found"; text: string }
  | { type: "done"; text: string }
  | { type: "error"; text: string };
