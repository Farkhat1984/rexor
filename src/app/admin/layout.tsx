"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu, IconX } from "@/components/Icons";

const adminNav = [
  { href: "/admin", label: "Товары" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/brands", label: "Бренды" },
  { href: "/admin/banners", label: "Баннеры" },
  { href: "/admin/settings", label: "Настройки" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const currentLabel = adminNav.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  )?.label ?? "Admin";

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-brand-900 text-white">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setOpen(true)} className="w-10 h-10 flex items-center justify-center -ml-2">
            <IconMenu className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-base tracking-[0.1em]">{currentLabel}</h1>
          <Link href="/" className="text-xs text-brand-400 underline">
            На сайт
          </Link>
        </div>
      </header>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-brand-900 text-white transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-brand-800">
          <span className="font-heading text-sm tracking-[0.1em]">REXOR Admin</span>
          <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center -mr-2">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <nav className="py-2">
          {adminNav.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 text-sm transition-colors ${
                  active ? "bg-brand-800 text-white font-medium" : "text-brand-300 hover:text-white hover:bg-brand-800/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="px-4 py-4">{children}</div>
    </div>
  );
}
