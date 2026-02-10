"use client";

import { useState, useMemo, useEffect } from "react";
import { useOrdersStore } from "@/store/orders";
import { formatPrice } from "@/lib/data";
import { OrderStatus } from "@/lib/types";
import { IconSearch } from "@/components/Icons";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Продано",
  rejected: "Отказ",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const PER_PAGE = 20;

export default function AdminOrdersPage() {
  const { orders, updateStatus, addNote, fetchOrders } = useOrdersStore();
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: orders.length,
      new: orders.filter((o) => o.status === "new").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      rejected: orders.filter((o) => o.status === "rejected").length,
    }),
    [orders]
  );

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status === "confirmed").reduce((s, o) => s + o.total, 0),
    [orders]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (q) {
        const matchContact = o.contactValue.toLowerCase().includes(q);
        const matchItem = o.items.some(
          (i) =>
            i.sku.toLowerCase().includes(q) ||
            i.brand.toLowerCase().includes(q) ||
            i.name.toLowerCase().includes(q)
        );
        const matchId = o.id.includes(q);
        if (!matchContact && !matchItem && !matchId) return false;
      }
      return true;
    });
  }, [orders, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleConfirm(orderId: string) {
    updateStatus(orderId, "confirmed");
  }

  function handleReject(orderId: string) {
    // API handles stock restoration atomically
    updateStatus(orderId, "rejected");
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
      " " + d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-lg text-brand-900">
          Заказы ({counts.all})
        </h2>
        {counts.new > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 font-medium">
            {counts.new} новых
          </span>
        )}
      </div>

      <div className="flex gap-3 mb-3 text-[11px] text-brand-500">
        <span>Выручка: <b className="text-brand-900">{formatPrice(totalRevenue)}</b></span>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {(
          [
            ["all", "Все", counts.all],
            ["new", "Новые", counts.new],
            ["confirmed", "Продано", counts.confirmed],
            ["rejected", "Отказ", counts.rejected],
          ] as [OrderStatus | "all", string, number][]
        ).map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => { setFilterStatus(value); setPage(1); }}
            className={`text-[10px] px-2 py-1 border ${
              filterStatus === value
                ? "bg-brand-900 text-white border-brand-900"
                : "text-brand-500 border-brand-200"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск: контакт, артикул, бренд..."
          className="w-full h-10 pl-9 pr-4 bg-brand-50 border border-brand-100 text-sm outline-none focus:border-brand-300"
        />
      </div>

      {/* Orders list */}
      <div className="space-y-2">
        {paginated.map((order) => (
          <div key={order.id} className="bg-brand-50 border border-brand-100 p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-brand-900">#{order.id.slice(-6)}</span>
                <span className={`text-[10px] px-2 py-0.5 border ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <span className="text-[10px] text-brand-400">{formatDate(order.createdAt)}</span>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] text-brand-400">{order.contactType === "telegram" ? "TG" : "WA"}:</span>
              <span className="text-xs font-medium text-brand-900">{order.contactValue}</span>
            </div>

            {/* Items summary */}
            <div className="space-y-1 mb-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-brand-700 truncate mr-2">
                    {item.brand} {item.name || item.sku} <span className="text-brand-400">×{item.quantity}</span>
                  </span>
                  <span className="text-brand-900 font-medium shrink-0">
                    {formatPrice(item.finalPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between border-t border-brand-200 pt-2 mb-2">
              <span className="text-sm font-medium text-brand-900">Итого</span>
              <span className="text-sm font-bold text-brand-900">{formatPrice(order.total)}</span>
            </div>

            {/* Actions for new orders */}
            {order.status === "new" && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleConfirm(order.id)}
                  className="flex-1 text-xs py-2 bg-green-700 text-white transition-colors active:bg-green-800"
                >
                  Продали
                </button>
                <button
                  onClick={() => handleReject(order.id)}
                  className="flex-1 text-xs py-2 bg-red-600 text-white transition-colors active:bg-red-700"
                >
                  Отказ
                </button>
              </div>
            )}

            {/* Expand/Note */}
            <button
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              className="text-[10px] text-brand-500 underline"
            >
              {expandedId === order.id ? "Свернуть" : "Заметка"}
            </button>

            {expandedId === order.id && (
              <div className="mt-2 pt-2 border-t border-brand-200">
                <label className="text-[10px] text-brand-400">Заметка</label>
                <textarea
                  value={order.note || ""}
                  onChange={(e) => addNote(order.id, e.target.value)}
                  placeholder="Примечание к заказу..."
                  rows={2}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-brand-200 text-xs outline-none focus:border-brand-400 resize-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center text-sm text-brand-700 border border-brand-200 bg-white disabled:opacity-30"
          >
            &lsaquo;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 2)
            .map((pg, idx, arr) => (
              <span key={pg} className="contents">
                {idx > 0 && arr[idx - 1] !== pg - 1 && (
                  <span className="text-brand-300 text-xs px-1">&hellip;</span>
                )}
                <button
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center text-xs border ${
                    pg === page ? "bg-brand-900 text-white border-brand-900" : "text-brand-700 border-brand-200 bg-white"
                  }`}
                >
                  {pg}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center text-sm text-brand-700 border border-brand-200 bg-white disabled:opacity-30"
          >
            &rsaquo;
          </button>
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-16 text-brand-400 text-sm">
          Заказов пока нет.
        </div>
      )}
    </div>
  );
}
