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

export type SortOption = "popular" | "price_asc" | "price_desc" | "new" | "discount" | "name_asc" | "name_desc";

export type OrderStatus = "new" | "confirmed" | "rejected";
export type ContactType = "telegram" | "whatsapp";

export interface OrderItem {
  productId: string;
  sku: string;
  brand: string;
  name: string;
  retailPrice: number;
  discount?: number;
  finalPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  contactType: ContactType;
  contactValue: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  image: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  contactType: ContactType;
  contactValue: string;
  ordersCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
}
