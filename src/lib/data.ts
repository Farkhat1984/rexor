import { Brand } from "./types";

export const brands: Brand[] = [
  { id: "1", name: "Casio", logo: "/brands/casio.svg", slug: "casio" },
  { id: "2", name: "Tissot", logo: "/brands/tissot.svg", slug: "tissot" },
  { id: "3", name: "Seiko", logo: "/brands/seiko.svg", slug: "seiko" },
  { id: "4", name: "Orient", logo: "/brands/orient.svg", slug: "orient" },
  { id: "5", name: "Citizen", logo: "/brands/citizen.svg", slug: "citizen" },
  { id: "6", name: "Fossil", logo: "/brands/fossil.svg", slug: "fossil" },
  { id: "7", name: "Beverly Hills Polo Club", logo: "/brands/bhpc.svg", slug: "bhpc" },
  { id: "8", name: "Daniel Klein", logo: "/brands/dk.svg", slug: "daniel-klein" },
  { id: "9", name: "Lee Cooper", logo: "/brands/lc.svg", slug: "lee-cooper" },
];

export function formatPrice(price: number): string {
  return price.toLocaleString("ru-KZ") + " ₸";
}

export function getDiscountedPrice(price: number, discount?: number): number {
  if (!discount || discount <= 0) return price;
  return Math.round(price * (1 - discount / 100));
}
