// Monetary values stored as integers (paise/cents)
// ₹50.00 = 5000 minor units

export type PaymentMethod = "cash" | "upi" | "card"
export type PaymentStatus = "pending" | "paid"
export type BillStatus = "draft" | "confirmed" | "voided"
export type UserRole = "owner" | "cashier"

export interface Hotel {
  id: string
  name: string
  address: string
  phone: string
  timezone: string
  currency: string
  gstin?: string
  receiptFooter: string
  taxEnabled: boolean
  taxRate: number // percentage
}

export interface User {
  uid: string
  name: string
  role: UserRole
  hotelId: string
}

export interface Category {
  id: string
  hotelId: string
  name: string
  displayOrder: number
  active: boolean
}

export interface MenuItem {
  id: string
  hotelId: string
  categoryId: string
  name: string
  tamilName?: string
  priceMinor: number // in paise
  isAvailable: boolean
  imageUrl?: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface BillItem {
  menuItemId: string
  name: string
  tamilName?: string
  priceMinor: number // price at time of billing (snapshot)
  quantity: number
  subtotalMinor: number
}

export interface Bill {
  id: string
  hotelId: string
  billNumber: string
  items: BillItem[]
  subtotalMinor: number
  discountMinor: number
  taxMinor: number
  totalMinor: number
  paymentStatus: PaymentStatus
  status: BillStatus
  createdBy: string
  createdAt: string
  confirmedAt?: string
  payment?: Payment
}

export interface Payment {
  id: string
  hotelId: string
  billId: string
  amountMinor: number
  method: PaymentMethod
  receivedAt: string
  receivedBy: string
  status: "completed"
}

export interface AuditLog {
  id: string
  hotelId: string
  entityType: string
  entityId: string
  action: string
  actorId: string
  timestamp: string
  details?: Record<string, unknown>
}

// Cart state (in-memory, not persisted to DB)
export interface CartItem {
  menuItemId: string
  name: string
  tamilName?: string
  priceMinor: number
  quantity: number
}

export interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  totalMinor: number
  totalItems: number
}
