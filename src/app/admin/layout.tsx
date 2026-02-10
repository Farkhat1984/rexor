"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNav = [
  { href: "/admin", label: "Товары" },
  { href: "/admin/brands", label: "Бренды" },
  { href: "/admin/banners", label: "Баннеры" },
  { href: "/admin/settings", label: "Настройки" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-brand-900 text-white">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-heading text-base tracking-[0.1em]">REXOR Admin</h1>
          <Link href="/" className="text-xs text-brand-400 underline">
            На сайт
          </Link>
        </div>
        <div className="flex border-t border-brand-800">
          {adminNav.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 text-center text-xs py-2.5 transition-colors ${
                  active ? "bg-brand-800 text-white" : "text-brand-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}
