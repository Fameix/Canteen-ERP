import type { Bill, MenuItem, Category, Hotel, User } from "./types"
import { DEMO_CATEGORIES, DEMO_HOTEL, DEMO_MENU_ITEMS } from "./seed-data"

const KEYS = {
  HOTEL: "hotel_erp_hotel",
  CATEGORIES: "hotel_erp_categories",
  MENU_ITEMS: "hotel_erp_menu_items",
  BILLS: "hotel_erp_bills",
  BILL_COUNTER: "hotel_erp_bill_counter",
  AUTH: "hotel_auth",
  MENU_VERSION: "hotel_erp_menu_version",
} as const

const MENU_VERSION = "om-saravana-bhava-2026-10-15"

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable
  }
}

// Hotel
export function getHotel(): Hotel {
  return safeGet(KEYS.HOTEL, DEMO_HOTEL)
}

export function saveHotel(hotel: Hotel): void {
  safeSet(KEYS.HOTEL, hotel)
}

// Categories
export function getCategories(): Category[] {
  return safeGet(KEYS.CATEGORIES, DEMO_CATEGORIES)
}

export function saveCategories(categories: Category[]): void {
  safeSet(KEYS.CATEGORIES, categories)
}

// Menu Items
export function getMenuItems(): MenuItem[] {
  const catalogImages = new Map(DEMO_MENU_ITEMS.map(item => [item.id, item.imageUrl]))
  return safeGet(KEYS.MENU_ITEMS, DEMO_MENU_ITEMS).map(item => {
    const imageUrl = catalogImages.get(item.id)
    // Backfill older saved records without resetting price or availability edits.
    if (imageUrl && (!item.imageUrl || item.imageUrl.startsWith("https://images.pexels.com/photos/") || /^\/images\/menu\/\d+\.jpg$/.test(item.imageUrl))) {
      return { ...item, imageUrl }
    }
    return item
  })
}

export function saveMenuItems(items: MenuItem[]): void {
  safeSet(KEYS.MENU_ITEMS, items)
}

export function addMenuItem(item: MenuItem): void {
  const items = getMenuItems()
  items.push(item)
  saveMenuItems(items)
}

export function updateMenuItem(updated: MenuItem): void {
  const items = getMenuItems()
  const idx = items.findIndex(i => i.id === updated.id)
  if (idx !== -1) {
    items[idx] = updated
    saveMenuItems(items)
  }
}

// Bills
export function getBills(): Bill[] {
  return safeGet(KEYS.BILLS, [])
}

export function saveBills(bills: Bill[]): void {
  safeSet(KEYS.BILLS, bills)
}

export function getBillById(id: string): Bill | undefined {
  return getBills().find(b => b.id === id)
}

export function saveBill(bill: Bill): void {
  const bills = getBills()
  const idx = bills.findIndex(b => b.id === bill.id)
  if (idx !== -1) {
    bills[idx] = bill
  } else {
    bills.unshift(bill) // newest first
  }
  saveBills(bills)
}

// Atomic bill number generation
export function generateBillNumber(): string {
  const counter = safeGet(KEYS.BILL_COUNTER, 0) + 1
  safeSet(KEYS.BILL_COUNTER, counter)
  const today = new Date()
  const dateStr = `${today.getFullYear().toString().slice(-2)}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
  return `B${dateStr}-${String(counter).padStart(4, "0")}`
}

// Auth
export function getAuth(): User | null {
  return safeGet(KEYS.AUTH, null)
}

export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEYS.AUTH)
  }
}

// Seed data initialization
export function initializeSeeds(): void {
  if (typeof window === "undefined") return
  // Replace the previous demo catalog once, then preserve subsequent edits.
  if (localStorage.getItem(KEYS.MENU_VERSION) !== MENU_VERSION) {
    saveMenuItems(DEMO_MENU_ITEMS.map(item => ({ ...item })))
    saveCategories(DEMO_CATEGORIES.map(category => ({ ...category })))
    localStorage.setItem(KEYS.MENU_VERSION, MENU_VERSION)
  } else {
    if (!localStorage.getItem(KEYS.MENU_ITEMS)) saveMenuItems(DEMO_MENU_ITEMS)
    if (!localStorage.getItem(KEYS.CATEGORIES)) saveCategories(DEMO_CATEGORIES)
  }
  if (!localStorage.getItem(KEYS.HOTEL)) {
    saveHotel(DEMO_HOTEL)
  }
}
