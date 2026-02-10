"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconGrid, IconCart, IconSearch } from "./Icons";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Главная", icon: IconHome },
  { href: "/catalog", label: "Каталог", icon: IconGrid },
  { href: "/search", label: "Поиск", icon: IconSearch },
  { href: "/cart", label: "Корзина", icon: IconCart },
];

export function BottomNav() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    setCount(items.reduce((sum, i) => sum + i.quantity, 0));
  }, [items]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-brand-200">
      <div className="mx-auto max-w-lg flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative ${
                active ? "text-brand-900" : "text-brand-400"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
              {label === "Корзина" && count > 0 && (
                <span className="absolute -top-0.5 right-1 bg-brand-900 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
