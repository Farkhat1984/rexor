"use client";

import { create } from "zustand";
import { Order, OrderItem, OrderStatus, ContactType, Customer } from "@/lib/types";

interface OrdersStore {
  orders: Order[];
  customers: Customer[];
  loaded: boolean;
  loading: boolean;
  fetchOrders: () => Promise<void>;
  addOrder: (
    items: OrderItem[],
    total: number,
    contactType: ContactType,
    contactValue: string
  ) => Promise<string>;
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  addNote: (orderId: string, note: string) => void;
}

let noteTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export const useOrdersStore = create<OrdersStore>()((set, get) => ({
  orders: [],
  customers: [],
  loaded: false,
  loading: false,

  fetchOrders: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/orders");
      const { orders, customers } = await res.json();
      set({ orders, customers, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addOrder: async (items, total, contactType, contactValue) => {
    const now = new Date().toISOString();
    const id = String(Date.now());
    const trimmed = contactValue.trim();

    // Optimistic
    const order: Order = { id, items, total, status: "new", contactType, contactValue: trimmed, createdAt: now, updatedAt: now };
    set({ orders: [order, ...get().orders] });

    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, total, contactType, contactValue }),
    });

    return id;
  },

  updateStatus: async (orderId, status) => {
    const now = new Date().toISOString();
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, status, updatedAt: now } : o)),
    });
    await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Refresh to get updated customers and stock
    set({ loaded: false, loading: false });
    get().fetchOrders();
  },

  addNote: (orderId, note) => {
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, note, updatedAt: new Date().toISOString() } : o)),
    });
    clearTimeout(noteTimers[orderId]);
    noteTimers[orderId] = setTimeout(() => {
      fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
    }, 500);
  },
}));
