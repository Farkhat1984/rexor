export interface Product {
  id: string;
  barcode: string;
  sku: string;
  country: string;
  brand: string;
  name: string;
  gender: string;
  strapColor: string;
  dialColor: string;
  caseSize: string;
  waterResistance: string;
  glass: string;
  caseShape: string;
  indicators: string;
  timeDisplay: string;
  features: string;
  mechanism: string;
  strapMaterial: string;
  caseMaterial: string;
  weight: string;
  kit: string;
  pairing: string;
  energySource: string;
  description: string;
  stock: number;
  purchasePrice: number;
  costPrice: number;
  retailPrice: number;
  images: string[];
  isNew?: boolean;
  isHit?: boolean;
  showOnMain?: boolean;
  discount?: number; // процент скидки, например 15 = 15%
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  slug: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Filters {
  brand: string[];
  gender: string[];
  mechanism: string[];
  caseShape: string[];
  priceMin: number;
  priceMax: number;
}

export type SortOption = "price_asc" | "price_desc" | "new";
