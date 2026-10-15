import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "./types"

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const items = get().items
        const existing = items.find(i => i.menuItemId === newItem.menuItemId)
        if (existing) {
          set({
            items: items.map(i =>
              i.menuItemId === newItem.menuItemId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({ items: [...items, { ...newItem, quantity: 1 }] })
        }
      },

      removeItem: (menuItemId) => {
        set({ items: get().items.filter(i => i.menuItemId !== menuItemId) })
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
          return
        }
        set({
          items: get().items.map(i =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "hotel_erp_cart",
      version: 1,
      // Old carts contain demo product IDs and prices from the previous catalog.
      migrate: () => ({ items: [] }),
    }
  )
)

// Derived selectors (computed outside store to avoid re-renders)
export function cartTotalMinor(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0)
}

export function cartTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function formatPriceMinor(minor: number): string {
  return `₹${(minor / 100).toFixed(2).replace(/\.00$/, "")}`
}

export function formatPrice(rupees: number): string {
  return `₹${rupees.toFixed(2).replace(/\.00$/, "")}`
}
