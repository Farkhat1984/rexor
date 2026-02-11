import Database from "better-sqlite3";
import path from "path";
import { Product } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "rexor.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id            TEXT PRIMARY KEY,
      barcode       TEXT NOT NULL DEFAULT '',
      sku           TEXT NOT NULL DEFAULT '',
      country       TEXT NOT NULL DEFAULT '',
      brand         TEXT NOT NULL DEFAULT '',
      name          TEXT NOT NULL DEFAULT '',
      gender        TEXT NOT NULL DEFAULT '',
      strapColor    TEXT NOT NULL DEFAULT '',
      dialColor     TEXT NOT NULL DEFAULT '',
      caseSize      TEXT NOT NULL DEFAULT '',
      waterResistance TEXT NOT NULL DEFAULT '',
      glass         TEXT NOT NULL DEFAULT '',
      caseShape     TEXT NOT NULL DEFAULT '',
      indicators    TEXT NOT NULL DEFAULT '',
      timeDisplay   TEXT NOT NULL DEFAULT '',
      features      TEXT NOT NULL DEFAULT '',
      mechanism     TEXT NOT NULL DEFAULT '',
      strapMaterial TEXT NOT NULL DEFAULT '',
      caseMaterial  TEXT NOT NULL DEFAULT '',
      weight        TEXT NOT NULL DEFAULT '',
      kit           TEXT NOT NULL DEFAULT '',
      pairing       TEXT NOT NULL DEFAULT '',
      energySource  TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      stock         INTEGER NOT NULL DEFAULT 0,
      purchasePrice INTEGER NOT NULL DEFAULT 0,
      costPrice     INTEGER NOT NULL DEFAULT 0,
      retailPrice   INTEGER NOT NULL DEFAULT 0,
      images        TEXT NOT NULL DEFAULT '[]',
      isNew         INTEGER NOT NULL DEFAULT 0,
      isHit         INTEGER NOT NULL DEFAULT 0,
      showOnMain    INTEGER NOT NULL DEFAULT 0,
      discount      INTEGER NOT NULL DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

    CREATE TABLE IF NOT EXISTS orders (
      id           TEXT PRIMARY KEY,
      items        TEXT NOT NULL DEFAULT '[]',
      total        INTEGER NOT NULL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'new',
      contactType  TEXT NOT NULL DEFAULT '',
      contactValue TEXT NOT NULL DEFAULT '',
      note         TEXT,
      createdAt    TEXT NOT NULL,
      updatedAt    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id           TEXT PRIMARY KEY,
      contactType  TEXT NOT NULL,
      contactValue TEXT NOT NULL,
      ordersCount  INTEGER NOT NULL DEFAULT 0,
      totalSpent   INTEGER NOT NULL DEFAULT 0,
      firstOrderAt TEXT NOT NULL,
      lastOrderAt  TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_contact
      ON customers(contactType, contactValue);

    CREATE TABLE IF NOT EXISTS brands (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL DEFAULT '',
      slug  TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS banners (
      id     TEXT PRIMARY KEY,
      image  TEXT NOT NULL DEFAULT '',
      link   TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS users (
      id        TEXT PRIMARY KEY,
      googleId  TEXT NOT NULL,
      email     TEXT NOT NULL,
      name      TEXT NOT NULL DEFAULT '',
      image     TEXT NOT NULL DEFAULT '',
      isAdmin   INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_googleId ON users(googleId);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

    INSERT OR IGNORE INTO settings (key, value) VALUES ('telegramUsername', 'rexor_watches');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('whatsappPhone', '77001234567');
  `);

  // Migration: add userId column to orders
  try { db.exec(`ALTER TABLE orders ADD COLUMN userId TEXT NOT NULL DEFAULT ''`); } catch {}

  // Migration: unique index on brand name for auto-sync from products
  try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_name ON brands(name)`); } catch {}
}

// --- Product serialization ---

export function serializeProduct(p: Product): Record<string, unknown> {
  return {
    id: p.id,
    barcode: p.barcode || "",
    sku: p.sku || "",
    country: p.country || "",
    brand: p.brand || "",
    name: p.name || "",
    gender: p.gender || "",
    strapColor: p.strapColor || "",
    dialColor: p.dialColor || "",
    caseSize: p.caseSize || "",
    waterResistance: p.waterResistance || "",
    glass: p.glass || "",
    caseShape: p.caseShape || "",
    indicators: p.indicators || "",
    timeDisplay: p.timeDisplay || "",
    features: p.features || "",
    mechanism: p.mechanism || "",
    strapMaterial: p.strapMaterial || "",
    caseMaterial: p.caseMaterial || "",
    weight: p.weight || "",
    kit: p.kit || "",
    pairing: p.pairing || "",
    energySource: p.energySource || "",
    description: p.description || "",
    stock: p.stock || 0,
    purchasePrice: p.purchasePrice || 0,
    costPrice: p.costPrice || 0,
    retailPrice: p.retailPrice || 0,
    images: JSON.stringify(p.images || []),
    isNew: p.isNew ? 1 : 0,
    isHit: p.isHit ? 1 : 0,
    showOnMain: p.showOnMain ? 1 : 0,
    discount: p.discount || 0,
  };
}

export function deserializeProduct(row: Record<string, unknown>): Product {
  return {
    ...(row as unknown as Product),
    images: JSON.parse((row.images as string) || "[]"),
    isNew: !!(row.isNew as number),
    isHit: !!(row.isHit as number),
    showOnMain: !!(row.showOnMain as number),
    discount: (row.discount as number) || 0,
  };
}
